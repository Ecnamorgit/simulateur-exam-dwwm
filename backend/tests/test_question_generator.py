"""Tests du parsing et du fallback du générateur de questions (sans réseau)."""

import pytest

import app.services.question_generator as qg
from app.services.question_generator import _parse_questions, DEFAULT_QUESTIONS


def test_default_questions_well_formed():
    assert len(DEFAULT_QUESTIONS) >= 10
    for q in DEFAULT_QUESTIONS:
        assert q["type"] in ("qcm", "jury")
        assert q["question_text"] and q["correct_answer"] and q["explanation"]
        if q["type"] == "qcm":
            assert isinstance(q["choices"], list) and len(q["choices"]) >= 2


def test_parse_questions_valid_array():
    content = '[{"type": "qcm", "question_text": "Q?", "choices": ["a", "b"], "correct_answer": "a", "explanation": "e"}]'
    parsed = _parse_questions(content)
    assert len(parsed) == 1
    assert parsed[0]["category"] == "Général"  # défaut ajouté


def test_parse_questions_markdown_fence():
    content = '```json\n[{"type": "jury", "question_text": "Q?", "correct_answer": "a", "explanation": "e"}]\n```'
    parsed = _parse_questions(content)
    assert parsed[0]["type"] == "jury"


def test_parse_questions_rejects_incomplete():
    with pytest.raises(ValueError):
        _parse_questions('[{"type": "qcm", "question_text": "Q?"}]')  # champs manquants


def test_parse_questions_rejects_empty():
    with pytest.raises(ValueError):
        _parse_questions('[]')


async def test_generate_uses_gemini_first(monkeypatch):
    monkeypatch.setattr(qg.settings, 'GEMINI_API_KEY', 'fake-key')

    async def fake_gemini(text):
        return [{'type': 'jury', 'question_text': 'via-gemini', 'correct_answer': 'a', 'explanation': 'e', 'category': 'X'}]

    monkeypatch.setattr(qg, '_call_gemini', fake_gemini)
    result = await qg.generate_questions_from_text('description projet')
    assert result[0]['question_text'] == 'via-gemini'


async def test_generate_falls_back_to_local_bank(monkeypatch):
    # Pas de clé Gemini + Ollama injoignable -> banque locale.
    monkeypatch.setattr(qg.settings, 'GEMINI_API_KEY', '')

    async def boom(text):
        raise RuntimeError('ollama down')

    monkeypatch.setattr(qg, '_call_ollama', boom)
    result = await qg.generate_questions_from_text('description projet')
    assert result is DEFAULT_QUESTIONS
