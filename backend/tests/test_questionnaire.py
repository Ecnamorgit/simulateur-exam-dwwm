"""Tests du questionnaire professionnel (service + endpoints)."""

import io

from fastapi.testclient import TestClient

from app.main import app
from app.services.questionnaire_generator import (
    generate_questionnaire,
    grade_closed_answers,
    evaluate_open_answer,
    STATIC_QUESTIONNAIRES,
)
from app.api.routes.certification import QuestionnaireResponse

client = TestClient(app)
BASE = "/api/certification"


async def test_static_fallback_has_valid_structure():
    # provider inconnu -> repli statique (pas d'appel LLM)
    result = await generate_questionnaire(stack="React", provider="static")
    # doit valider le schema de reponse
    QuestionnaireResponse(**result)
    assert len(result["closed_questions"]) == 2
    assert len(result["open_questions"]) == 2
    assert len(result["documentation"]) > 100


def test_all_static_questionnaires_are_well_formed():
    for q in STATIC_QUESTIONNAIRES:
        assert len(q["closed_questions"]) == 2
        assert len(q["open_questions"]) == 2
        for cq in q["closed_questions"]:
            # la bonne reponse doit figurer parmi les choix
            assert cq["correct_answer"] in cq["choices"]


def test_grade_closed_answers():
    closed = STATIC_QUESTIONNAIRES[0]["closed_questions"]
    good = closed[0]["correct_answer"]
    result = grade_closed_answers(closed, [good, "mauvaise reponse"])
    assert result["correct"] == 1
    assert result["total"] == 2
    assert result["details"][0]["is_correct"] is True
    assert result["details"][1]["is_correct"] is False


async def test_evaluate_open_answer_fallback():
    ev = await evaluate_open_answer(
        "Explain PUT vs POST",
        "PUT replaces an existing resource while POST creates a new one on the server.",
        documentation="",
        provider="fallback",  # force le mode hors-ligne
    )
    assert set(ev.keys()) == {"relevance_score", "english_score", "feedback"}
    assert 0 <= ev["relevance_score"] <= 10


async def test_evaluate_open_answer_empty():
    ev = await evaluate_open_answer("Q", "", provider="fallback")
    assert ev["relevance_score"] == 0
    assert ev["english_score"] == 0


def test_endpoint_get_questionnaire_static():
    r = client.get(f"{BASE}/questionnaire", params={"stack": "React", "provider": "static"})
    assert r.status_code == 200
    data = r.json()
    assert len(data["closed_questions"]) == 2
    assert len(data["open_questions"]) == 2


def test_endpoint_evaluate_questionnaire():
    q = STATIC_QUESTIONNAIRES[0]
    payload = {
        "documentation": q["documentation"],
        "closed_questions": q["closed_questions"],
        "closed_answers": [q["closed_questions"][0]["correct_answer"], "faux"],
        "open_questions": [oq["question"] for oq in q["open_questions"]],
        "open_answers": ["PUT replaces a resource, POST creates one.", "Status codes help clients react."],
        "provider": "fallback",  # pas d'appel LLM
    }
    r = client.post(f"{BASE}/questionnaire-evaluate", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data["closed"]["correct"] == 1
    assert data["closed"]["total"] == 2
    assert len(data["open"]) == 2
