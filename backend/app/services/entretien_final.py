"""
Entretien final (épreuve de 15 min du DWWM).

Échange non technique portant sur la compréhension du métier, la posture
professionnelle, le parcours du candidat, son Dossier Professionnel (DP) et sa
motivation. Aucune question de code.

Fournit :
  - FINAL_QUESTIONS : banque de questions statiques (orientées métier)
  - evaluate_final_answer(question, answer) : évalue le savoir-être / la clarté
"""

import json

import httpx

from app.core.config import settings
from app.services.dwwm_referentiel import DWWM_REAC_PROMPT

_GEMINI_TIMEOUT = httpx.Timeout(30.0, connect=10.0)


# Banque de questions non techniques (métier, posture, parcours, DP, motivation).
FINAL_QUESTIONS: list[str] = [
    "Pouvez-vous vous présenter en quelques mots et décrire votre parcours vers le développement web ?",
    "Qu'est-ce qui vous motive dans le métier de développeur web et web mobile ?",
    "Comment vous tenez-vous informé des évolutions de votre métier au quotidien ?",
    "Décrivez une situation de travail en équipe : quel était votre rôle et comment avez-vous communiqué ?",
    "Selon vous, quelles sont les qualités professionnelles essentielles d'un bon développeur ?",
    "Que retenez-vous de la réalisation de votre Dossier Professionnel (DP) et de votre période en entreprise ?",
]


def _fallback_final_eval(answer: str) -> dict:
    words = [w.lower() for w in answer.split()]
    wc = len(words)
    unique_words = len(set(words))
    unique_ratio = unique_words / max(1, wc)

    if wc == 0 or (wc > 5 and unique_ratio < 0.35):
        return {"score": 0, "feedback": "Réponse absurde, répétitive ou inexistante. Score : 0/10."}
    
    score = min(10, 2 + wc // 15)
    if wc < 15:
        feedback = "Réponse un peu courte : développez votre propos et illustrez par un exemple concret."
    else:
        feedback = ("Réponse enregistrée (évaluation hors-ligne). Soignez la structure et la posture "
                    "professionnelle : contexte, action, résultat.")
    return {"score": score, "feedback": feedback}


async def _call_gemini_final(question: str, answer: str) -> dict:
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent"
    prompt = (
        "Vous êtes un membre du jury DWWM lors de l'entretien final (non technique).\n"
        f"{DWWM_REAC_PROMPT}\n\n"
        "RÈGLES D'ÉVALUATION :\n"
        "Évaluez le SAVOIR-ÊTRE et la CLARTÉ de la réponse du candidat.\n"
        "Si la réponse est absurde, hors-sujet ou répétitive (ex: 'neige soleil'), attribuez IMPÉRATIVEMENT un score de 0 sur 10.\n\n"
        "Retournez UNIQUEMENT un JSON : "
        '{"score": <int 0-10>, "feedback": "<feedback franc et professionnel, 2-3 phrases>"}\n\n'
        f"Question : {question}\n\nRéponse du candidat : {answer}"
    )
    data = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"temperature": 0.5, "maxOutputTokens": 400}}
    async with httpx.AsyncClient(timeout=_GEMINI_TIMEOUT) as client:
        r = await client.post(url, json=data, headers={"Content-Type": "application/json", "x-goog-api-key": api_key})
        r.raise_for_status()
        res = r.json()
    content = res["candidates"][0]["content"]["parts"][0]["text"].strip()
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.split("```")[1].split("```")[0].strip()
    start, end = content.find("{"), content.rfind("}")
    if start != -1 and end != -1:
        content = content[start:end + 1]
    parsed = json.loads(content)
    try:
        score = max(0, min(10, int(parsed.get("score", 6))))
    except (TypeError, ValueError):
        score = 6
    return {"score": score, "feedback": str(parsed.get("feedback", "Réponse évaluée."))}


async def evaluate_final_answer(question: str, answer: str, provider: str = "auto") -> dict:
    """Évalue une réponse de l'entretien final (savoir-être / clarté)."""
    if not answer or not answer.strip():
        return {"score": 0, "feedback": "Aucune réponse fournie."}
    if provider in ("gemini", "auto"):
        try:
            return await _call_gemini_final(question, answer)
        except Exception as e:
            print(f"[entretien_final] Gemini failed: {e}")
    return _fallback_final_eval(answer)
