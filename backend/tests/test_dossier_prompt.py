"""Tests du prompt de génération de questions basé sur le contenu réel."""

from app.api.routes.certification import build_dossier_prompt, MAX_DOSSIER_PROMPT_CHARS


def test_prompt_includes_real_extracted_content():
    text = "Mon projet gère un catalogue de plantes avec un panier et un paiement Stripe. Marqueur unique: ZORGLUB42."
    prompt = build_dossier_prompt("dossier.pdf", ["React", "FastAPI"], text)
    assert "ZORGLUB42" in prompt
    assert "catalogue de plantes" in prompt
    assert "React" in prompt


def test_prompt_is_truncated():
    long_text = "A" * (MAX_DOSSIER_PROMPT_CHARS + 5000)
    prompt = build_dossier_prompt("dossier.pdf", ["React"], long_text)
    # Le contenu injecté ne dépasse pas la limite (le prompt total = en-tête + contenu tronqué).
    assert prompt.count("A") == MAX_DOSSIER_PROMPT_CHARS


def test_prompt_falls_back_when_no_text():
    prompt = build_dossier_prompt("dossier.pdf", ["React", "FastAPI"], "")
    assert "s'intitule" in prompt
    assert "React" in prompt
