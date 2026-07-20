"""Tests des fonctions de parsing/fallback de l'évaluateur oral (sans réseau)."""

from app.services.oral_evaluator import (
    _parse_evaluation,
    _normalize_soutenance,
    _parse_soutenance_json,
    _fallback_evaluation,
    _fallback_soutenance,
    evaluate_oral_answer,
    evaluate_soutenance,
)


def test_parse_evaluation_valid():
    r = _parse_evaluation('{"score": 8, "detected_keywords": ["api"], "missing_keywords": [], "feedback": "ok", "follow_up_question": "", "is_follow_up": false}')
    assert r["score"] == 8
    assert r["detected_keywords"] == ["api"]


def test_parse_evaluation_markdown_fence_and_clamp():
    r = _parse_evaluation('```json\n{"score": 42}\n```')
    assert r["score"] == 10  # borné à 10


def test_parse_evaluation_bad_score_defaults():
    r = _parse_evaluation('{"score": "not a number"}')
    assert r["score"] == 5
    assert isinstance(r["detected_keywords"], list)


def test_parse_evaluation_coerces_keyword_types():
    r = _parse_evaluation('{"score": 5, "detected_keywords": [1, 2, "sql"]}')
    assert all(isinstance(k, str) for k in r["detected_keywords"])


def test_fallback_evaluation_shape():
    r = _fallback_evaluation("Question", "Une réponse avec api rest et jwt et bcrypt.")
    assert set(r.keys()) == {"score", "detected_keywords", "missing_keywords", "feedback", "follow_up_question", "is_follow_up"}
    assert 0 <= r["score"] <= 10


def test_normalize_soutenance_defaults_on_garbage():
    r = _normalize_soutenance({"overall_score": "bad", "phases_covered": "oops"})
    assert r["overall_score"] == 60
    assert r["phases_covered"] == []
    assert isinstance(r["custom_jury_questions"], list)


def test_parse_soutenance_json_normalizes():
    r = _parse_soutenance_json('{"overall_score": 88, "strengths": ["a"], "phases_covered": [{"phase": "Intro", "detected": true, "feedback": "ok"}]}')
    assert r["overall_score"] == 88
    assert r["phases_covered"][0]["phase"] == "Intro"


def test_fallback_soutenance_full_shape():
    r = _fallback_soutenance("Présentation React api sql securité", "dossier", 700)
    assert 0 <= r["overall_score"] <= 100
    assert len(r["phases_covered"]) == 5
    assert len(r["custom_jury_questions"]) == 3


async def test_evaluate_oral_answer_fallback_provider():
    r = await evaluate_oral_answer("Q", "réponse api rest", provider="fallback")
    assert 0 <= r["score"] <= 10


async def test_evaluate_soutenance_fallback_provider():
    r = await evaluate_soutenance("présentation du projet", provider="fallback")
    assert len(r["phases_covered"]) == 5
