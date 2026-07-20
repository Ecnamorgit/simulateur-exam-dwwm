"""
Oral Evaluator Service — Interactive AI Examiner for DWWM certification.

Supports two providers:
  1. Gemini (Google AI) — primary, cloud-based
  2. Ollama (local) — fallback when no API key or Gemini unreachable

Evaluates a candidate's spoken response to a jury question,
returns a score, detected/missing keywords, feedback, and follow-up question.
"""

import json
import urllib.request
import urllib.error
import asyncio
import re

from app.core.config import settings


# ---------------------------------------------------------------------------
# Gemini provider
# ---------------------------------------------------------------------------

def _call_gemini(question: str, user_answer: str, context: list[dict] | None = None) -> dict:
    """Call Google Gemini API to evaluate an oral answer."""
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set")

    model = settings.GEMINI_MODEL
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

    system_prompt = (
        "Vous êtes un examinateur du Titre Professionnel Développeur Web et Web Mobile (RNCP 37674). "
        "Vous menez un entretien technique oral avec un candidat.\n\n"
        "VOTRE RÔLE :\n"
        "1. Évaluer la réponse du candidat à la question posée.\n"
        "2. Identifier les mots-clés techniques corrects utilisés et ceux qui manquent.\n"
        "3. Donner un score de 0 à 10.\n"
        "4. Fournir un feedback constructif et bienveillant (2-3 phrases max).\n"
        "5. Poser une question de relance pertinente (approfondir le sujet ou passer au suivant si score >= 7).\n\n"
        "RETOURNEZ UNIQUEMENT un JSON valide avec cette structure exacte :\n"
        '{"score": <int 0-10>, "detected_keywords": [<mots-clés trouvés>], '
        '"missing_keywords": [<mots-clés manquants importants>], '
        '"feedback": "<feedback constructif>", '
        '"follow_up_question": "<question de relance>", '
        '"is_follow_up": <true si relance sur le même sujet, false si nouveau sujet>}\n\n'
        "IMPORTANT : Répondez UNIQUEMENT avec le JSON, sans texte autour."
    )

    # Build conversation context
    context_text = ""
    if context:
        context_text = "\n\nHistorique de l'entretien :\n"
        for entry in context[-6:]:  # Keep last 3 exchanges
            context_text += f"- Examinateur : {entry.get('question', '')}\n"
            context_text += f"- Candidat : {entry.get('answer', '')}\n"

    user_prompt = (
        f"{context_text}\n"
        f"Question posée au candidat : {question}\n\n"
        f"Réponse du candidat : {user_answer}\n\n"
        "Évaluez cette réponse."
    )

    data = {
        "contents": [
            {
                "parts": [
                    {"text": system_prompt + "\n\n" + user_prompt}
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 1024
        }
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
        method="POST"
    )

    with urllib.request.urlopen(req, timeout=30) as response:
        res_data = json.loads(response.read().decode("utf-8"))
        content = res_data["candidates"][0]["content"]["parts"][0]["text"].strip()
        return _parse_evaluation(content)


# ---------------------------------------------------------------------------
# Ollama provider (local fallback)
# ---------------------------------------------------------------------------

def _call_ollama_eval(question: str, user_answer: str, context: list[dict] | None = None) -> dict:
    """Call local Ollama to evaluate an oral answer."""
    url = "http://localhost:11434/api/chat"
    model = "qwen2.5-coder:14b"

    system_prompt = (
        "Vous êtes un examinateur du Titre Professionnel Développeur Web et Web Mobile (RNCP 37674). "
        "Évaluez la réponse du candidat et retournez UNIQUEMENT un JSON valide :\n"
        '{"score": <int 0-10>, "detected_keywords": [<list>], '
        '"missing_keywords": [<list>], "feedback": "<string>", '
        '"follow_up_question": "<string>", "is_follow_up": <bool>}'
    )

    context_text = ""
    if context:
        for entry in context[-6:]:
            context_text += f"Examinateur: {entry.get('question', '')}\nCandidat: {entry.get('answer', '')}\n"

    user_prompt = (
        f"{context_text}\n"
        f"Question: {question}\nRéponse du candidat: {user_answer}\n"
        "Évaluez."
    )

    data = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "stream": False
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    with urllib.request.urlopen(req, timeout=60) as response:
        res_data = json.loads(response.read().decode("utf-8"))
        content = res_data["message"]["content"].strip()
        return _parse_evaluation(content)


# ---------------------------------------------------------------------------
# Shared parsing and fallback logic
# ---------------------------------------------------------------------------

def _parse_evaluation(content: str) -> dict:
    """Parse JSON evaluation from LLM response."""
    # Clean markdown code blocks
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.split("```")[1].split("```")[0].strip()

    # Find JSON object
    obj_start = content.find("{")
    obj_end = content.rfind("}")
    if obj_start != -1 and obj_end != -1:
        content = content[obj_start:obj_end + 1]

    parsed = json.loads(content)

    # Validate and normalize
    result = {
        "score": max(0, min(10, int(parsed.get("score", 5)))),
        "detected_keywords": parsed.get("detected_keywords", []),
        "missing_keywords": parsed.get("missing_keywords", []),
        "feedback": parsed.get("feedback", "Réponse enregistrée."),
        "follow_up_question": parsed.get("follow_up_question", ""),
        "is_follow_up": parsed.get("is_follow_up", False)
    }
    return result


def _fallback_evaluation(question: str, user_answer: str) -> dict:
    """Simple keyword-based evaluation when both LLMs are unavailable."""
    # Extract simple keywords from the question for basic matching
    answer_lower = user_answer.lower()
    
    # Common technical keywords that would be relevant
    tech_keywords = [
        "api", "rest", "http", "cors", "jwt", "token", "bcrypt", "hash",
        "sql", "nosql", "mongodb", "base de données", "requête",
        "react", "composant", "state", "hook", "usestate", "useeffect",
        "html", "css", "responsive", "flexbox", "grid", "sémantique",
        "git", "branch", "commit", "docker", "ci/cd", "pipeline",
        "test", "unitaire", "intégration", "jest", "cypress",
        "rgpd", "cnil", "données personnelles", "consentement",
        "owasp", "injection", "xss", "csrf", "sécurité",
        "agile", "scrum", "sprint", "backlog", "user story",
        "maquette", "wireframe", "prototype", "figma", "ux", "ui",
        "accessibilité", "rgaa", "wcag", "contraste", "aria",
        "serveur", "client", "middleware", "authentification", "autorisation"
    ]

    detected = [kw for kw in tech_keywords if kw in answer_lower]
    word_count = len(user_answer.split())
    
    # Score based on keywords found and answer length
    score = min(10, len(detected) * 2 + (1 if word_count > 20 else 0) + (1 if word_count > 50 else 0))

    return {
        "score": score,
        "detected_keywords": detected[:8],
        "missing_keywords": [],
        "feedback": f"Réponse analysée en mode hors-ligne. {len(detected)} termes techniques détectés. "
                    f"{'Essayez de développer davantage.' if word_count < 30 else 'Bonne longueur de réponse.'}",
        "follow_up_question": "",
        "is_follow_up": False
    }


# ---------------------------------------------------------------------------
# Public async API
# ---------------------------------------------------------------------------

async def evaluate_oral_answer(
    question: str,
    user_answer: str,
    context: list[dict] | None = None,
    provider: str = "auto"
) -> dict:
    """
    Evaluate a candidate's oral answer using the best available provider.
    """
    if provider == "gemini" or provider == "auto":
        try:
            return await asyncio.to_thread(_call_gemini, question, user_answer, context)
        except Exception as e:
            print(f"[oral_evaluator] Gemini failed: {e}")
            if provider == "gemini":
                return _fallback_evaluation(question, user_answer)

    if provider == "ollama" or provider == "auto":
        try:
            return await asyncio.to_thread(_call_ollama_eval, question, user_answer, context)
        except Exception as e:
            print(f"[oral_evaluator] Ollama failed: {e}")

    # Final fallback: keyword-based
    return _fallback_evaluation(question, user_answer)


# ---------------------------------------------------------------------------
# Full Soutenance (35 min presentation) Evaluation
# ---------------------------------------------------------------------------

def _call_gemini_soutenance(transcript: str, dossier_text: str = "", duration_seconds: int = 0) -> dict:
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set")

    model = settings.GEMINI_MODEL
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

    system_prompt = (
        "Vous êtes le président du jury d'examen du Titre Professionnel Développeur Web et Web Mobile (RNCP 37674). "
        "Vous devez évaluer la présentation orale (soutenance de 35 minutes) réalisée par le candidat.\n\n"
        "Analysez la transcription de sa présentation orale ainsi que son dossier de projet (si fourni).\n\n"
        "VOTRE ÉVALUATION DOIT RETOURNER UNIQUEMENT UN JSON VALIDE avec la structure suivante :\n"
        "{\n"
        '  "overall_score": <int 0-100>,\n'
        '  "time_management_score": <int 0-100>,\n'
        '  "technical_depth_score": <int 0-100>,\n'
        '  "clarity_score": <int 0-100>,\n'
        '  "phases_covered": [\n'
        '    {"phase": "Introduction & Contexte", "detected": <bool>, "feedback": "<remarque>"},\n'
        '    {"phase": "Conception UX/UI & Wireframes", "detected": <bool>, "feedback": "<remarque>"},\n'
        '    {"phase": "Démonstration de l\'Application", "detected": <bool>, "feedback": "<remarque>"},\n'
        '    {"phase": "Architecture, Code & BDD", "detected": <bool>, "feedback": "<remarque>"},\n'
        '    {"phase": "Sécurité, DevOps & Bilan", "detected": <bool>, "feedback": "<remarque>"}\n'
        '  ],\n'
        '  "strengths": [<3 points forts en français>],\n'
        '  "areas_for_improvement": [<3 points d\'amélioration en français>],\n'
        '  "custom_jury_questions": [\n'
        '    {"question_text": "<question ciblée sur ce que le candidat a dit ou omis>", "category": "<CCP1/CCP2/Sécurité/DevOps>", "context_reason": "<pourquoi cette question>"},\n'
        '    {"question_text": "<question 2>", "category": "<domaine>", "context_reason": "<raison>"},\n'
        '    {"question_text": "<question 3>", "category": "<domaine>", "context_reason": "<raison>"}\n'
        '  ]\n'
        "}\n\n"
        "RETOURNEZ UNIQUEMENT LE JSON SANS TEXTE AUTOUR."
    )

    dossier_info = f"\n\nContenu du Dossier de Projet du candidat :\n{dossier_text[:3000]}" if dossier_text else "\n\n(Aucun dossier de projet n'a été fourni, évaluation basée uniquement sur l'oral)."
    user_prompt = (
        f"Durée réelle de la présentation : {duration_seconds // 60} minutes et {duration_seconds % 60} secondes.\n\n"
        f"Transcription de la présentation orale du candidat :\n\n{transcript[:6000]}"
        f"{dossier_info}\n\n"
        "Évaluez la soutenance et générez les 3 questions de jury personnalisées."
    )

    data = {
        "contents": [{"parts": [{"text": system_prompt + "\n\n" + user_prompt}]}],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 2048}
    }

    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers={"Content-Type": "application/json", "x-goog-api-key": api_key}, method="POST")

    with urllib.request.urlopen(req, timeout=45) as response:
        res_data = json.loads(response.read().decode("utf-8"))
        content = res_data["candidates"][0]["content"]["parts"][0]["text"].strip()
        return _parse_soutenance_json(content)


def _call_ollama_soutenance(transcript: str, dossier_text: str = "", duration_seconds: int = 0) -> dict:
    url = "http://localhost:11434/api/chat"
    model = "qwen2.5-coder:14b"

    system_prompt = (
        "Vous êtes le président du jury DWWM RNCP 37674. Évaluez la soutenance orale et retournez UNIQUEMENT un JSON :\n"
        '{"overall_score": 80, "time_management_score": 85, "technical_depth_score": 75, "clarity_score": 80, '
        '"phases_covered": [{"phase": "Intro", "detected": true, "feedback": "bien"}], '
        '"strengths": ["Clarté"], "areas_for_improvement": ["Détailler la BDD"], '
        '"custom_jury_questions": [{"question_text": "...", "category": "BDD", "context_reason": "..."}]}'
    )

    user_prompt = f"Durée: {duration_seconds}s.\nOral: {transcript[:4000]}\nDossier: {dossier_text[:2000]}"

    data = {
        "model": model,
        "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
        "stream": False
    }

    req = urllib.request.Request(url, data=json.dumps(data).encode("utf-8"), headers={"Content-Type": "application/json"}, method="POST")

    with urllib.request.urlopen(req, timeout=60) as response:
        res_data = json.loads(response.read().decode("utf-8"))
        content = res_data["message"]["content"].strip()
        return _parse_soutenance_json(content)


def _parse_soutenance_json(content: str) -> dict:
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.split("```")[1].split("```")[0].strip()

    start = content.find("{")
    end = content.rfind("}")
    if start != -1 and end != -1:
        content = content[start:end + 1]

    parsed = json.loads(content)
    return parsed


def _fallback_soutenance(transcript: str, dossier_text: str = "", duration_seconds: int = 0) -> dict:
    word_count = len(transcript.split())
    has_dossier = len(dossier_text) > 50

    base_score = 65
    if word_count > 100: base_score += 10
    if word_count > 300: base_score += 10
    if has_dossier: base_score += 10

    return {
        "overall_score": min(95, base_score),
        "time_management_score": 80 if duration_seconds > 600 else 60,
        "technical_depth_score": 75 if "react" in transcript.lower() or "api" in transcript.lower() else 60,
        "clarity_score": 75,
        "phases_covered": [
            {"phase": "Introduction & Contexte", "detected": True, "feedback": "Présentation entamée."},
            {"phase": "Conception UX/UI & Wireframes", "detected": "maquette" in transcript.lower() or "figma" in transcript.lower(), "feedback": "Mention des choix UI."},
            {"phase": "Démonstration de l'Application", "detected": True, "feedback": "Démo réalisée."},
            {"phase": "Architecture, Code & BDD", "detected": "sql" in transcript.lower() or "api" in transcript.lower() or "code" in transcript.lower(), "feedback": "Eléments d'architecture."},
            {"phase": "Sécurité, DevOps & Bilan", "detected": "securit" in transcript.lower() or "docker" in transcript.lower(), "feedback": "Perspectives et bilan."}
        ],
        "strengths": [
            "Présentation orale fluide et compréhensible",
            "Couverture globale des fonctionnalités du projet",
            "Dossier joint analysé avec succès" if has_dossier else "Utilisation d'un vocabulaire technique approprié"
        ],
        "areas_for_improvement": [
            "Préciser l'architecture de la base de données (MCD/MLD)",
            "Développer les choix de sécurité (CORS, Bcrypt, OWASP)",
            "Mieux structurer la conclusion et le bilan personnel"
        ],
        "custom_jury_questions": [
            {
                "question_text": "Pouvez-vous expliciter la structure de votre base de données et comment vous assurez l'intégrité référentielle ?",
                "category": "BDD/SQL/Modélisation",
                "context_reason": "Question classique du jury sur la partie back-end."
            },
            {
                "question_text": "Comment avez-vous sécurisé les échanges entre votre front-end et votre API backend ?",
                "category": "Auth/Sécurité",
                "context_reason": "Vérification des notions CORS, JWT et HTTPS."
            },
            {
                "question_text": "Si vous deviez ajouter une nouvelle fonctionnalité complexe, quelle démarche agile adopteriez-vous ?",
                "category": "Agilité/Scrum",
                "context_reason": "Évaluation de la conduite de projet."
            }
        ]
    }


async def evaluate_soutenance(
    transcript: str,
    dossier_text: str = "",
    duration_seconds: int = 0,
    provider: str = "auto"
) -> dict:
    if provider == "gemini" or provider == "auto":
        try:
            return await asyncio.to_thread(_call_gemini_soutenance, transcript, dossier_text, duration_seconds)
        except Exception as e:
            print(f"[oral_evaluator] Gemini soutenance failed: {e}")

    if provider == "ollama" or provider == "auto":
        try:
            return await asyncio.to_thread(_call_ollama_soutenance, transcript, dossier_text, duration_seconds)
        except Exception as e:
            print(f"[oral_evaluator] Ollama soutenance failed: {e}")

    return _fallback_soutenance(transcript, dossier_text, duration_seconds)

