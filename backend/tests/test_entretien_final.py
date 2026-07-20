"""Tests de l'entretien final (service + endpoints)."""

from fastapi.testclient import TestClient

from app.main import app
from app.services.entretien_final import FINAL_QUESTIONS, evaluate_final_answer

client = TestClient(app)
BASE = "/api/certification"


def test_questions_bank_non_empty():
    assert len(FINAL_QUESTIONS) >= 5
    # aucune question ne doit être technique (pas de mots de code)
    joined = " ".join(FINAL_QUESTIONS).lower()
    for banned in ["sql", "javascript", "fonction", "algorithme", "http"]:
        assert banned not in joined


async def test_evaluate_final_fallback():
    ev = await evaluate_final_answer(
        FINAL_QUESTIONS[0],
        "Je suis passionné par le développement depuis plusieurs années et j'aime résoudre des problèmes concrets en équipe.",
        provider="fallback",
    )
    assert 0 <= ev["score"] <= 10
    assert ev["feedback"]


async def test_evaluate_final_empty():
    ev = await evaluate_final_answer("Q", "", provider="fallback")
    assert ev["score"] == 0


def test_endpoint_questions():
    r = client.get(f"{BASE}/entretien-final-questions")
    assert r.status_code == 200
    assert len(r.json()["questions"]) >= 5


def test_endpoint_evaluate():
    r = client.post(f"{BASE}/entretien-final-evaluate", json={
        "question": FINAL_QUESTIONS[0],
        "answer": "Mon parcours m'a permis de développer rigueur et autonomie, et j'aime transmettre.",
        "provider": "fallback",
    })
    assert r.status_code == 200
    data = r.json()
    assert 0 <= data["score"] <= 10
    assert data["feedback"]
