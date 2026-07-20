from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.sqlite import get_db, ExamSession, CriteriaResult, GeneratedQuestion
from app.services.speech_fallback import transcribe_audio_fallback
from app.services.question_generator import generate_questions_from_text
from app.services.oral_evaluator import evaluate_oral_answer, evaluate_soutenance
from app.services.tts_service import generate_speech, DEFAULT_VOICE
from app.core.config import settings
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
import json

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

@router.post("/upload", response_model=UploadResponse)
async def upload_document(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    filename = file.filename.lower()
    
    # Read binary file content to scan for key technologies
    contents = await file.read()
    try:
        decoded_content = contents.decode("utf-8", errors="ignore").lower()
    except Exception:
        decoded_content = ""
        
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

    # Basic compliance check
    has_mcd = any(x in filename or x in decoded_content for x in ["mcd", "mld", "sql", "diagram", "db", "bdd"])
    has_rgpd = any(x in filename or x in decoded_content for x in ["rgpd", "gdpr", "privacy", "dcp", "cnil"])
    has_veille = any(x in filename or x in decoded_content for x in ["veille", "owasp", "securit", "vulnerab"])
    has_tests = any(x in filename or x in decoded_content for x in ["test", "unit", "cypress", "jest", "pytest"])

    score_calc = 60
    if has_mcd: score_calc += 10
    if has_rgpd: score_calc += 10
    if has_veille: score_calc += 10
    if has_tests: score_calc += 10

    criteria_data = [
        {"name": "Modélisation des données (MCD/MLD)", "checked": has_mcd, "feedback": "Section MCD/MLD présente et validée." if has_mcd else "Schémas de base de données (MCD/MLD) manquants."},
        {"name": "Conformité RGPD & CNIL", "checked": has_rgpd, "feedback": "Mentions légales et traitement des DCP conformes." if has_rgpd else "Absence de détails sur la mise en conformité RGPD."},
        {"name": "Veille technologique et OWASP", "checked": has_veille, "feedback": "Veille sur les failles de sécurité bien documentée." if has_veille else "Mesures de protection OWASP non mentionnées."},
        {"name": "Tests et intégration continue", "checked": has_tests, "feedback": "Tests unitaires et E2E correctement planifiés." if has_tests else "Plan de test et d'intégration continue manquant."},
    ]

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

    # Generate custom questions using LLM local service
    project_description_prompt = (
        f"Le document s'intitule '{file.filename}'. "
        f"Les technologies identifiées sont : {', '.join(techs)}. "
        f"Le document mentionne des notions de modélisation de données, de sécurité, de veille et de tests."
    )
    
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
async def create_session(req: SessionCreateRequest, db: AsyncSession = Depends(get_db)):
    session = ExamSession(
        duration_seconds=req.duration_seconds,
        score=req.score,
        transcript=req.transcript,
        status=req.status
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return {
        "id": session.id,
        "date": session.date,
        "duration_seconds": session.duration_seconds,
        "score": session.score,
        "transcript": session.transcript,
        "status": session.status
    }

@router.get("/sessions", response_model=List[SessionSchema])
async def get_sessions(db: AsyncSession = Depends(get_db)):
    stmt = select(ExamSession).order_by(ExamSession.date.desc())
    result = await db.execute(stmt)
    sessions = result.scalars().all()
    return [
        {
            "id": s.id,
            "date": s.date,
            "duration_seconds": s.duration_seconds,
            "score": s.score,
            "transcript": s.transcript,
            "status": s.status
        }
        for s in sessions
    ]


# ---------------------------------------------------------------------------
# Interactive Oral Evaluation
# ---------------------------------------------------------------------------

class OralEvalRequest(BaseModel):
    question: str
    user_answer: str
    context: Optional[List[dict]] = None
    provider: Optional[str] = "auto"  # "gemini", "ollama", or "auto"


@router.post("/oral-evaluate", response_model=OralEvalResponse)
async def oral_evaluate(req: OralEvalRequest):
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
async def soutenance_evaluate(req: SoutenanceEvalRequest):
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
async def tts_endpoint(text: str, voice: Optional[str] = DEFAULT_VOICE):
    """
    Generate neural French speech audio using edge-tts (Microsoft Edge Neural Voices).
    Returns audio/mpeg MP3.
    """
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail="Le texte est vide.")

    try:
        audio_bytes = await generate_speech(text=text, voice=voice or DEFAULT_VOICE)
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        print(f"[TTS Error] {e}")
        raise HTTPException(status_code=500, detail=f"Erreur de génération TTS: {str(e)}")


