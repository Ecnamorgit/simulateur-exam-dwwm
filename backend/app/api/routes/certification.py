from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.sqlite import get_db, ExamSession, CriteriaResult, GeneratedQuestion, User
from app.api.routes.auth import get_current_user
from app.services.speech_fallback import transcribe_audio_fallback
from app.services.question_generator import generate_questions_from_text
from app.services.document_parser import extract_text
from app.services.dossier_checker import analyze_dossier
from app.services.oral_evaluator import evaluate_oral_answer, evaluate_soutenance
from app.services.questionnaire_generator import (
    generate_questionnaire,
    grade_closed_answers,
    evaluate_open_answer,
)
from app.services.entretien_final import FINAL_QUESTIONS, evaluate_final_answer
from app.services.tts_service import generate_speech, DEFAULT_VOICE
from app.core.config import settings
from app.core.rate_limit import limiter
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
import json


def _file_extension(filename: str) -> str:
    """Retourne l'extension du fichier en minuscules, point inclus (ex. '.pdf')."""
    if not filename or "." not in filename:
        return ""
    return "." + filename.rsplit(".", 1)[-1].lower()


# Longueur max du contenu de dossier envoyé au générateur de questions.
MAX_DOSSIER_PROMPT_CHARS = 6000


def build_dossier_prompt(filename: str, techs: list[str], extracted_text: str) -> str:
    """
    Construit le prompt envoyé au générateur de questions à partir du CONTENU
    RÉEL extrait du dossier (tronqué), afin que les questions portent sur le
    projet du candidat et non sur une description générique.
    """
    content = (extracted_text or "").strip()
    if content:
        return (
            f"Titre du dossier : '{filename}'.\n"
            f"Technologies identifiées : {', '.join(techs)}.\n\n"
            "Génère des questions d'examen portant spécifiquement sur le contenu "
            "réel du dossier de projet ci-dessous :\n\n"
            f"{content[:MAX_DOSSIER_PROMPT_CHARS]}"
        )
    # Aucun texte exploitable extrait : repli sur une description générique.
    return (
        f"Le document s'intitule '{filename}'. "
        f"Les technologies identifiées sont : {', '.join(techs)}."
    )

router = APIRouter(prefix="/certification")

# ---------------------------------------------------------------------------
# Schémas Pydantic — validation ET documentation des réponses (branchés en
# response_model sur chaque endpoint ; visibles dans /docs).
# ---------------------------------------------------------------------------

class CriteriaResultSchema(BaseModel):
    name: str
    checked: bool
    feedback: str
    model_config = ConfigDict(from_attributes=True)

class QuestionContentSchema(BaseModel):
    """Contenu d'une question (sans identifiant BDD)."""
    type: str
    question_text: str
    choices: Optional[List[str]] = None
    correct_answer: str
    explanation: str

class SessionQuestionSchema(QuestionContentSchema):
    """Question telle que stockée en base (avec son id)."""
    id: int

class UploadResponse(BaseModel):
    session_id: int
    score: int
    criteria: List[CriteriaResultSchema]
    questions: List[QuestionContentSchema]

class SessionSchema(BaseModel):
    id: int
    date: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    score: Optional[int] = None
    transcript: Optional[str] = None
    status: Optional[str] = None
    exam_part: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class TranscriptionResponse(BaseModel):
    transcription: str

class OralEvalResponse(BaseModel):
    score: int
    detected_keywords: List[str]
    missing_keywords: List[str]
    feedback: str
    follow_up_question: str
    is_follow_up: bool

class OralConfigResponse(BaseModel):
    gemini_available: bool
    ollama_available: bool
    default_provider: str

class PhaseCoveredSchema(BaseModel):
    phase: str
    detected: bool
    feedback: str

class JuryQuestionSchema(BaseModel):
    question_text: str
    category: str
    context_reason: str

class SoutenanceResponse(BaseModel):
    overall_score: int
    time_management_score: int
    technical_depth_score: int
    clarity_score: int
    phases_covered: List[PhaseCoveredSchema]
    strengths: List[str]
    areas_for_improvement: List[str]
    custom_jury_questions: List[JuryQuestionSchema]

class SessionCreateRequest(BaseModel):
    duration_seconds: int
    score: int
    transcript: str
    status: str
    exam_part: Optional[str] = None

@router.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    filename = (file.filename or "").lower()

    # Whitelist d'extensions -> 415 Unsupported Media Type
    ext = _file_extension(filename)
    if ext not in settings.allowed_upload_extensions_set:
        allowed = ", ".join(sorted(settings.allowed_upload_extensions_set))
        raise HTTPException(
            status_code=415,
            detail=f"Type de fichier non supporté ({ext or 'inconnu'}). Extensions autorisées : {allowed}.",
        )

    # Read binary file content
    contents = await file.read()

    # Limite de taille -> 413 Payload Too Large
    if len(contents) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"Fichier trop volumineux (maximum {settings.MAX_UPLOAD_SIZE_MB} Mo).",
        )

    # Extraction réelle du texte (PDF/DOCX/MD/TXT) au lieu d'un décodage brut.
    extracted_text = extract_text(file.filename or "", contents)
    decoded_content = extracted_text.lower()

    # Heuristics scanning for keywords
    techs = []
    for tech in ["react", "vue", "angular", "typescript", "javascript", "html", "css", "tailwind",
                 "fastapi", "express", "nest", "django", "flask", "node", "php", "laravel",
                 "sqlite", "postgres", "mysql", "mongodb", "redis", "firebase", "prisma", "sequelize",
                 "docker", "kubernetes", "github", "gitlab", "jenkins", "bcrypt", "jwt", "cors", "owasp"]:
        if tech in decoded_content or tech in filename:
            techs.append(tech.capitalize())
            
    # Fallback to standard DWWM stack if none detected
    if not techs:
        techs = ["React", "FastAPI", "SQLite", "Bcrypt", "JWT", "CORS"]

    # Analyse du dossier selon le sommaire officiel du référentiel
    # (10 rubriques + détection du résumé en anglais obligatoire).
    analysis = analyze_dossier(extracted_text)
    score_calc = analysis["score"]
    criteria_data = analysis["criteria"]

    # Save the practice session
    session = ExamSession(
        duration_seconds=0,
        score=score_calc,
        transcript=f"Projet: {file.filename} - Techs: {', '.join(techs)}",
        status="dossier_validated"
    )
    db.add(session)
    await db.flush() # Populate session.id

    # Create criteria entries
    results = []
    for item in criteria_data:
        res = CriteriaResult(
            session_id=session.id,
            name=item["name"],
            checked=item["checked"],
            feedback=item["feedback"]
        )
        db.add(res)
        results.append({
            "name": res.name,
            "checked": res.checked,
            "feedback": res.feedback
        })

    # Generate custom questions based on the REAL extracted dossier content.
    project_description_prompt = build_dossier_prompt(file.filename or "", techs, extracted_text)
    generated_questions = await generate_questions_from_text(project_description_prompt)
    
    questions_response = []
    for q in generated_questions:
        db_q = GeneratedQuestion(
            session_id=session.id,
            type=q["type"],
            question_text=q["question_text"],
            choices=json.dumps(q.get("choices")) if q["type"] == "qcm" else None,
            correct_answer=q["correct_answer"],
            explanation=q["explanation"]
        )
        db.add(db_q)
        
        questions_response.append({
            "type": q["type"],
            "question_text": q["question_text"],
            "choices": q.get("choices"),
            "correct_answer": q["correct_answer"],
            "explanation": q["explanation"]
        })

    await db.commit()

    return {
        "session_id": session.id,
        "score": score_calc,
        "criteria": results,
        "questions": questions_response
    }

@router.get("/sessions/{session_id}/questions", response_model=List[SessionQuestionSchema])
async def get_session_questions(session_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(GeneratedQuestion).where(GeneratedQuestion.session_id == session_id)
    result = await db.execute(stmt)
    questions = result.scalars().all()
    
    response = []
    for q in questions:
        response.append({
            "id": q.id,
            "type": q.type,
            "question_text": q.question_text,
            "choices": json.loads(q.choices) if q.choices else None,
            "correct_answer": q.correct_answer,
            "explanation": q.explanation
        })
    return response

@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(file: UploadFile = File(...)):
    file_data = await file.read()
    try:
        transcription = await transcribe_audio_fallback(file_data)
        return {"transcription": transcription}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/sessions", response_model=SessionSchema)
async def create_session(
    req: SessionCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = ExamSession(
        duration_seconds=req.duration_seconds,
        score=req.score,
        transcript=req.transcript,
        status=req.status,
        exam_part=req.exam_part,
        user_id=current_user.id,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session

@router.get("/sessions", response_model=List[SessionSchema])
async def get_sessions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(ExamSession)
        .where(ExamSession.user_id == current_user.id)
        .order_by(ExamSession.date.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


# ---------------------------------------------------------------------------
# Interactive Oral Evaluation
# ---------------------------------------------------------------------------

class OralEvalRequest(BaseModel):
    question: str
    user_answer: str
    context: Optional[List[dict]] = None
    provider: Optional[str] = "auto"  # "gemini", "ollama", or "auto"


@router.post("/oral-evaluate", response_model=OralEvalResponse)
@limiter.limit("30/minute")
async def oral_evaluate(request: Request, req: OralEvalRequest):
    """Evaluate a candidate's spoken answer via AI examiner."""
    if not req.user_answer or not req.user_answer.strip():
        raise HTTPException(status_code=400, detail="La réponse du candidat est vide.")

    result = await evaluate_oral_answer(
        question=req.question,
        user_answer=req.user_answer,
        context=req.context,
        provider=req.provider or "auto"
    )
    return result


@router.get("/oral-config", response_model=OralConfigResponse)
async def oral_config():
    """Return available providers for the frontend."""
    gemini_available = settings.gemini_configured
    return {
        "gemini_available": gemini_available,
        "ollama_available": True,  # Assumed; will fail gracefully if not running
        "default_provider": "gemini" if gemini_available else "ollama"
    }


class SoutenanceEvalRequest(BaseModel):
    transcript: str
    dossier_text: Optional[str] = ""
    duration_seconds: Optional[int] = 0
    provider: Optional[str] = "auto"


@router.post("/soutenance-evaluate", response_model=SoutenanceResponse)
@limiter.limit("10/minute")
async def soutenance_evaluate(request: Request, req: SoutenanceEvalRequest):
    """Evaluate a candidate's full 35-min oral presentation and return score + questions."""
    if not req.transcript or not req.transcript.strip():
        raise HTTPException(status_code=400, detail="La transcription de la présentation est vide.")

    result = await evaluate_soutenance(
        transcript=req.transcript,
        dossier_text=req.dossier_text or "",
        duration_seconds=req.duration_seconds or 0,
        provider=req.provider or "auto"
    )
    return result


@router.get("/tts")
@limiter.limit("20/minute")
async def tts_endpoint(request: Request, text: str, voice: Optional[str] = DEFAULT_VOICE):
    """
    Generate neural French speech audio using edge-tts (Microsoft Edge Neural Voices).
    Returns audio/mpeg MP3.
    """
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Le texte est vide.")

    # Limite de longueur -> 413 (protège d'un abus du proxy TTS)
    if len(text) > settings.MAX_TTS_TEXT_LENGTH:
        raise HTTPException(
            status_code=413,
            detail=f"Texte trop long (maximum {settings.MAX_TTS_TEXT_LENGTH} caractères).",
        )

    try:
        audio_bytes = await generate_speech(text=text, voice=voice or DEFAULT_VOICE)
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        print(f"[TTS Error] {e}")
        raise HTTPException(status_code=500, detail=f"Erreur de génération TTS: {str(e)}")


# ---------------------------------------------------------------------------
# Questionnaire professionnel (30 min) : doc EN + 2 QCU FR + 2 ouvertes EN
# ---------------------------------------------------------------------------

class ClosedQuestionSchema(BaseModel):
    question: str
    choices: List[str]
    correct_answer: str = ""

class OpenQuestionSchema(BaseModel):
    question: str

class QuestionnaireResponse(BaseModel):
    documentation: str
    closed_questions: List[ClosedQuestionSchema]
    open_questions: List[OpenQuestionSchema]

class QuestionnaireEvalRequest(BaseModel):
    documentation: Optional[str] = ""
    closed_questions: List[ClosedQuestionSchema] = []
    closed_answers: List[str] = []
    open_questions: List[str] = []
    open_answers: List[str] = []
    provider: Optional[str] = "auto"

class ClosedDetailSchema(BaseModel):
    question: str
    given: str
    correct_answer: str
    is_correct: bool

class ClosedResultSchema(BaseModel):
    correct: int
    total: int
    details: List[ClosedDetailSchema]

class OpenResultSchema(BaseModel):
    question: str
    relevance_score: int
    english_score: int
    feedback: str

class QuestionnaireEvalResponse(BaseModel):
    closed: ClosedResultSchema
    open: List[OpenResultSchema]


@router.get("/questionnaire", response_model=QuestionnaireResponse)
@limiter.limit("15/minute")
async def questionnaire(request: Request, stack: str = "", provider: str = "auto"):
    """Génère un questionnaire professionnel (documentation EN + 2 QCU FR + 2 ouvertes EN)."""
    return await generate_questionnaire(stack=stack, provider=provider or "auto")


@router.post("/questionnaire-evaluate", response_model=QuestionnaireEvalResponse)
@limiter.limit("15/minute")
async def questionnaire_evaluate(request: Request, req: QuestionnaireEvalRequest):
    """Corrige les 2 QCU et évalue les 2 réponses ouvertes anglaises (contenu + anglais)."""
    closed = grade_closed_answers(
        [q.model_dump() for q in req.closed_questions],
        req.closed_answers,
    )
    open_results = []
    for i, question_text in enumerate(req.open_questions):
        answer = req.open_answers[i] if i < len(req.open_answers) else ""
        evaluation = await evaluate_open_answer(
            question_text, answer, req.documentation or "", provider=req.provider or "auto"
        )
        open_results.append({"question": question_text, **evaluation})

    return {"closed": closed, "open": open_results}


# ---------------------------------------------------------------------------
# Entretien final (15 min) : échange non technique (métier, posture, DP...)
# ---------------------------------------------------------------------------

class FinalQuestionsResponse(BaseModel):
    questions: List[str]

class FinalEvalRequest(BaseModel):
    question: str
    answer: str
    provider: Optional[str] = "auto"

class FinalEvalResponse(BaseModel):
    score: int
    feedback: str


@router.get("/entretien-final-questions", response_model=FinalQuestionsResponse)
async def entretien_final_questions():
    """Banque de questions non techniques de l'entretien final."""
    return {"questions": FINAL_QUESTIONS}


@router.post("/entretien-final-evaluate", response_model=FinalEvalResponse)
@limiter.limit("30/minute")
async def entretien_final_evaluate(request: Request, req: FinalEvalRequest):
    """Évalue le savoir-être / la clarté d'une réponse de l'entretien final."""
    return await evaluate_final_answer(req.question, req.answer, provider=req.provider or "auto")


