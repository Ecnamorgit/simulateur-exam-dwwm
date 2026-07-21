"""
Oral Evaluator Service — Interactive AI Examiner for DWWM certification.

Supports two providers:
  1. Gemini (Google AI) — primary, cloud-based
  2. Ollama (local) — fallback when no API key or Gemini unreachable

Evaluates a candidate's spoken response to a jury question,
returns a score, detected/missing keywords, feedback, and follow-up question.
"""

import json
import re

import httpx

from app.core.config import settings
from app.services.dwwm_referentiel import DWWM_REAC_PROMPT

# Timeouts (en secondes) : connexion courte, lecture plus longue pour laisser
# le temps au LLM de générer sa réponse.
_GEMINI_TIMEOUT = httpx.Timeout(45.0, connect=10.0)
_OLLAMA_TIMEOUT = httpx.Timeout(60.0, connect=10.0)


# ---------------------------------------------------------------------------
# Gemini provider
# ---------------------------------------------------------------------------

async def _call_gemini(question: str, user_answer: str, context: list[dict] | None = None) -> dict:
    """Call Google Gemini API to evaluate an oral answer."""
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set")

    model = settings.GEMINI_MODEL
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

    system_prompt = (
        "Vous êtes un examinateur EXIGEANT ET SANS COMPLAISANCE du Titre Professionnel Développeur Web et Web Mobile (RNCP 37674).\n"
        f"{DWWM_REAC_PROMPT}\n\n"
        "RÈGLES STRICTES D'ÉVALUATION :\n"
        "1. Si la réponse est absurde, répétitive (ex: répétition de mots incohérents comme 'neige soleil') ou dépourvue de tout contenu technique, "
        "attribuez IMPÉRATIVEMENT un score de 0 sur 10 (score = 0).\n"
        "2. Ne donnez un score >= 7 sur 10 QUE si le candidat utilise un vocabulaire technique exact du référentiel DWWM.\n"
        "3. Identifier les mots-clés techniques corrects utilisés et ceux qui manquent.\n"
        "4. Fournir un feedback franc, constructif et professionnel (2-3 phrases max).\n"
        "5. Poser une question de relance pertinente.\n\n"
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

    async with httpx.AsyncClient(timeout=_GEMINI_TIMEOUT) as client:
        response = await client.post(
            url,
            json=data,
            headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
        )
        response.raise_for_status()
        res_data = response.json()
    content = res_data["candidates"][0]["content"]["parts"][0]["text"].strip()
    return _parse_evaluation(content)


# ---------------------------------------------------------------------------
# Ollama provider (local fallback)
# ---------------------------------------------------------------------------

async def _call_ollama_eval(question: str, user_answer: str, context: list[dict] | None = None) -> dict:
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

    async with httpx.AsyncClient(timeout=_OLLAMA_TIMEOUT) as client:
        response = await client.post(url, json=data)
        response.raise_for_status()
        res_data = response.json()
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

    def _str_list(value) -> list[str]:
        return [str(x) for x in value] if isinstance(value, list) else []

    try:
        score = max(0, min(10, int(parsed.get("score", 5))))
    except (TypeError, ValueError):
        score = 5

    # Validate and normalize
    result = {
        "score": score,
        "detected_keywords": _str_list(parsed.get("detected_keywords")),
        "missing_keywords": _str_list(parsed.get("missing_keywords")),
        "feedback": str(parsed.get("feedback", "Réponse enregistrée.")),
        "follow_up_question": str(parsed.get("follow_up_question", "") or ""),
        "is_follow_up": bool(parsed.get("is_follow_up", False))
    }
    return result


def _fallback_evaluation(question: str, user_answer: str) -> dict:
    """Simple keyword-based evaluation when both LLMs are unavailable."""
    answer_lower = user_answer.lower()
    words = answer_lower.split()
    word_count = len(words)
    unique_words = len(set(words))
    unique_ratio = unique_words / max(1, word_count)
    
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
    
    # Strict score calculation
    if len(detected) == 0 or (word_count > 5 and unique_ratio < 0.4):
        score = 0 if word_count < 10 or unique_ratio < 0.3 else 1
    else:
        score = min(10, len(detected) * 2 + (1 if word_count > 20 else 0))

    return {
        "score": score,
        "detected_keywords": detected[:8],
        "missing_keywords": ["vocabulaire_technique_dwwm"] if not detected else [],
        "feedback": f"Réponse analysée (mode hors-ligne). {len(detected)} terme(s) technique(s) identifié(s). "
                    f"{'Attention : réponse sans substance technique ou répétitive.' if score <= 1 else 'Bonne utilisation des notions.'}",
        "follow_up_question": "Pouvez-vous développer les aspects techniques et l'architecture de votre solution ?" if score <= 2 else "",
        "is_follow_up": score <= 2
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
            return await _call_gemini(question, user_answer, context)
        except Exception as e:
            print(f"[oral_evaluator] Gemini failed: {e}")
            if provider == "gemini":
                return _fallback_evaluation(question, user_answer)

    if provider == "ollama" or provider == "auto":
        try:
            return await _call_ollama_eval(question, user_answer, context)
        except Exception as e:
            print(f"[oral_evaluator] Ollama failed: {e}")

    # Final fallback: keyword-based
    return _fallback_evaluation(question, user_answer)


# ---------------------------------------------------------------------------
# Full Soutenance (35 min presentation) Evaluation
# ---------------------------------------------------------------------------

async def _call_gemini_soutenance(transcript: str, dossier_text: str = "", presentation_text: str = "", duration_seconds: int = 0) -> dict:
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set")

    model = settings.GEMINI_MODEL
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

    system_prompt = (
        "Vous êtes le président du jury d'examen du Titre Professionnel Développeur Web et Web Mobile (RNCP 37674). "
        "Vous êtes un jury EXIGEANT, RIGOUREUX et SANS COMPLAISANCE.\n"
        f"{DWWM_REAC_PROMPT}\n\n"
        "DIRECTIVES STRICTES D'ÉVALUATION ET DE BAREME :\n"
        "1. DISCOURS ABSURDE / RÉPÉTITION / SANS SUBSTANCE (ex: 'neige soleil') : Si la transcription contient des mots répétés, du texte absurde, hors-sujet ou dépourvu de contenu technique du référentiel DWWM (C1 à C8), "
        "attribuez IMPÉRATIVEMENT 0 sur 100 à overall_score, 0 à technical_depth_score, 0 à clarity_score et 0 à time_management_score.\n"
        "2. GESTION DU TEMPS : La soutenance officielle dure 35 minutes (~2100 s). Si la durée réelle est inférieure à 5 minutes (< 300 secondes), time_management_score = 0 et overall_score <= 10.\n"
        "3. COHÉRENCE : Analysez conjointement l'oral, le Dossier de Projet et les slides. Sanctionnez sévèrement toute incohérence ou improvisation.\n"
        "4. EXIGENCES : Une note >= 70/100 est réservée exclusivement aux prestations professionnelles et techniquement abouties.\n\n"
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

    dossier_info = (
        f"\n\nContenu du Dossier de Projet du candidat :\n{dossier_text[:3000]}"
        if dossier_text else "\n\n(Aucun dossier de projet n'a été fourni.)"
    )
    presentation_info = (
        f"\n\nContenu du support de présentation (slides) projeté pendant l'oral :\n{presentation_text[:3000]}"
        if presentation_text else "\n\n(Aucun support de présentation n'a été fourni.)"
    )
    user_prompt = (
        f"Durée réelle de la présentation : {duration_seconds // 60} minutes et {duration_seconds % 60} secondes.\n\n"
        f"Transcription de la présentation orale du candidat :\n\n{transcript[:6000]}"
        f"{dossier_info}"
        f"{presentation_info}\n\n"
        "Évaluez la soutenance en croisant les 3 sources, et générez 3 questions de jury personnalisées "
        "qui exploitent la cohérence (ou les écarts) entre l'oral, le dossier et les slides."
    )

    data = {
        "contents": [{"parts": [{"text": system_prompt + "\n\n" + user_prompt}]}],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 2048}
    }

    async with httpx.AsyncClient(timeout=_GEMINI_TIMEOUT) as client:
        response = await client.post(
            url,
            json=data,
            headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
        )
        response.raise_for_status()
        res_data = response.json()
    content = res_data["candidates"][0]["content"]["parts"][0]["text"].strip()
    return _parse_soutenance_json(content)


async def _call_ollama_soutenance(transcript: str, dossier_text: str = "", presentation_text: str = "", duration_seconds: int = 0) -> dict:
    url = "http://localhost:11434/api/chat"
    model = "qwen2.5-coder:14b"

    system_prompt = (
        "Vous êtes le président du jury DWWM RNCP 37674. Évaluez la soutenance orale et retournez UNIQUEMENT un JSON :\n"
        '{"overall_score": 80, "time_management_score": 85, "technical_depth_score": 75, "clarity_score": 80, '
        '"phases_covered": [{"phase": "Intro", "detected": true, "feedback": "bien"}], '
        '"strengths": ["Clarté"], "areas_for_improvement": ["Détailler la BDD"], '
        '"custom_jury_questions": [{"question_text": "...", "category": "BDD", "context_reason": "..."}]}'
    )

    user_prompt = (
        f"Durée: {duration_seconds}s.\n"
        f"Oral: {transcript[:4000]}\n"
        f"Dossier: {dossier_text[:2000]}\n"
        f"Slides: {presentation_text[:2000]}"
    )

    data = {
        "model": model,
        "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
        "stream": False
    }

    async with httpx.AsyncClient(timeout=_OLLAMA_TIMEOUT) as client:
        response = await client.post(url, json=data)
        response.raise_for_status()
        res_data = response.json()
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
    return _normalize_soutenance(parsed)


def _normalize_soutenance(parsed: dict) -> dict:
    """
    Garantit la structure complète attendue par le schéma SoutenanceResponse,
    avec des valeurs par défaut, pour qu'une réponse LLM incomplète/malformée
    ne provoque jamais une erreur 500 côté API.
    """
    if not isinstance(parsed, dict):
        parsed = {}

    def _score(value, default: int = 0) -> int:
        try:
            return max(0, min(100, int(value)))
        except (TypeError, ValueError):
            return default

    def _str_list(value) -> list[str]:
        return [str(x) for x in value] if isinstance(value, list) else []

    phases = []
    for p in parsed.get("phases_covered") or []:
        if isinstance(p, dict):
            phases.append({
                "phase": str(p.get("phase", "")),
                "detected": bool(p.get("detected", False)),
                "feedback": str(p.get("feedback", "")),
            })

    jury = []
    for q in parsed.get("custom_jury_questions") or []:
        if isinstance(q, dict):
            jury.append({
                "question_text": str(q.get("question_text", "")),
                "category": str(q.get("category", "Général")),
                "context_reason": str(q.get("context_reason", "")),
            })

    return {
        "overall_score": _score(parsed.get("overall_score")),
        "time_management_score": _score(parsed.get("time_management_score")),
        "technical_depth_score": _score(parsed.get("technical_depth_score")),
        "clarity_score": _score(parsed.get("clarity_score")),
        "phases_covered": phases,
        "strengths": _str_list(parsed.get("strengths")),
        "areas_for_improvement": _str_list(parsed.get("areas_for_improvement")),
        "custom_jury_questions": jury,
    }


def _fallback_soutenance(transcript: str, dossier_text: str = "", presentation_text: str = "", duration_seconds: int = 0) -> dict:
    words = [w.lower() for w in transcript.split()]
    word_count = len(words)
    unique_words = len(set(words))
    unique_ratio = unique_words / max(1, word_count)
    has_dossier = len(dossier_text) > 50

    # Tech keywords detection
    tech_keywords = [
        "react", "vue", "angular", "fastapi", "express", "sql", "bdd", "database",
        "api", "rest", "cors", "jwt", "bcrypt", "html", "css", "wireframe", "maquette",
        "docker", "git", "scrum", "agile", "securit", "owasp", "test", "figma"
    ]
    detected_tech = [k for k in tech_keywords if k in transcript.lower()]

    # Detect gibberish or extreme repetition (e.g. "neige soleil") or short duration
    is_gibberish = (word_count > 10 and unique_ratio < 0.35) or (word_count < 30 and len(detected_tech) == 0)

    if is_gibberish or word_count < 15:
        return {
            "overall_score": 0,
            "time_management_score": 0,
            "technical_depth_score": 0,
            "clarity_score": 0,
            "phases_covered": [
                {"phase": "Introduction & Contexte", "detected": False, "feedback": "Contenu insuffisant ou non-sensique."},
                {"phase": "Conception UX/UI & Wireframes", "detected": False, "feedback": "Non abordé."},
                {"phase": "Démonstration de l'Application", "detected": False, "feedback": "Aucune démonstration technique identifiée."},
                {"phase": "Architecture, Code & BDD", "detected": False, "feedback": "Aucun vocabulaire technique détecté."},
                {"phase": "Sécurité, DevOps & Bilan", "detected": False, "feedback": "Non abordé."},
            ],
            "strengths": [
                "Système d'enregistrement audio fonctionnel",
            ],
            "areas_for_improvement": [
                "Le discours est dépourvu de substance technique (absence de mots-clés du Titre DWWM)",
                "La durée et le vocabulaire sont insuffisants pour une soutenance de 35 minutes",
                "Structurer l'oral selon le déroulé officiel (Intro, UI, Démo, Code/BDD, Bilan)",
            ],
            "custom_jury_questions": [
                {
                    "question_text": "Pouvez-vous réellement présenter l'architecture technique de votre projet DWWM ?",
                    "category": "Architecture",
                    "context_reason": "Discours oral incomplet ou non technique."
                },
                {
                    "question_text": "Quelles sont les technologies principales utilisées dans votre application web ?",
                    "category": "Technologie",
                    "context_reason": "Aucune technologie mentionnée clairement."
                },
                {
                    "question_text": "Comment est structurée votre base de données SQL / NoSQL ?",
                    "category": "BDD",
                    "context_reason": "Question de rattrapage."
                }
            ]
        }

    base_score = 45
    if len(detected_tech) >= 2: base_score += 15
    if len(detected_tech) >= 5: base_score += 15
    if duration_seconds >= 900: base_score += 10
    if has_dossier: base_score += 5

    return {
        "overall_score": min(85, base_score),
        "time_management_score": 85 if duration_seconds >= 1200 else (60 if duration_seconds >= 600 else 35),
        "technical_depth_score": 75 if len(detected_tech) >= 4 else 50,
        "clarity_score": 70 if unique_ratio > 0.5 else 45,
        "phases_covered": [
            {"phase": "Introduction & Contexte", "detected": True, "feedback": "Présentation entamée."},
            {"phase": "Conception UX/UI & Wireframes", "detected": "maquette" in transcript.lower() or "figma" in transcript.lower(), "feedback": "Mention des choix UI."},
            {"phase": "Démonstration de l'Application", "detected": True, "feedback": "Démo réalisée."},
            {"phase": "Architecture, Code & BDD", "detected": "sql" in transcript.lower() or "api" in transcript.lower() or "code" in transcript.lower(), "feedback": "Eléments d'architecture."},
            {"phase": "Sécurité, DevOps & Bilan", "detected": "securit" in transcript.lower() or "docker" in transcript.lower(), "feedback": "Perspectives et bilan."}
        ],
        "strengths": [
            "Présentation orale enregistrée et analysée",
            f"Termes techniques DWWM identifiés ({', '.join(detected_tech[:4]) or 'aucun'})",
            "Dossier de projet associé" if has_dossier else "Format respecté"
        ],
        "areas_for_improvement": [
            "Approfondir les choix d'architecture (MCD/MLD, schémas API)",
            "Détailler les aspects sécurité (JWT, Bcrypt, OWASP, HTTPS)",
            "Optimiser la gestion du temps pour atteindre les 35 minutes réglementaires"
        ],
        "custom_jury_questions": [
            {
                "question_text": "Pouvez-vous expliciter la structure de votre base de données et comment vous assurez l'intégrité référentielle ?",
                "category": "BDD/SQL/Modélisation",
                "context_reason": "Question du jury sur la partie back-end."
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
    presentation_text: str = "",
    duration_seconds: int = 0,
    provider: str = "auto"
) -> dict:
    if provider == "gemini" or provider == "auto":
        try:
            return await _call_gemini_soutenance(transcript, dossier_text, presentation_text, duration_seconds)
        except Exception as e:
            print(f"[oral_evaluator] Gemini soutenance failed: {e}")

    if provider == "ollama" or provider == "auto":
        try:
            return await _call_ollama_soutenance(transcript, dossier_text, presentation_text, duration_seconds)
        except Exception as e:
            print(f"[oral_evaluator] Ollama soutenance failed: {e}")

    return _fallback_soutenance(transcript, dossier_text, presentation_text, duration_seconds)

