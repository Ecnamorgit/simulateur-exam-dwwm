"""Tests unitaires de l'extraction de texte (app.services.document_parser)."""

from pathlib import Path

from app.services.document_parser import extract_text

FIXTURES = Path(__file__).parent / "fixtures"


def _read(name: str) -> bytes:
    return (FIXTURES / name).read_bytes()


def test_extract_txt():
    text = extract_text("sample.txt", _read("sample.txt"))
    assert "TXTOK" in text
    assert "FastAPI" in text


def test_extract_md():
    text = extract_text("sample.md", _read("sample.md"))
    assert "MDOK" in text
    assert "Cahier des charges" in text


def test_extract_docx():
    text = extract_text("sample.docx", _read("sample.docx"))
    assert "DOCXOK" in text
    # Le texte des tableaux doit aussi être extrait.
    assert "MCD MLD BDD" in text


def test_extract_pdf():
    text = extract_text("sample.pdf", _read("sample.pdf"))
    assert "PDFOK" in text


def test_unknown_extension_falls_back_to_plain():
    text = extract_text("data.csv", b"colonne1;colonne2\nMarqueur:CSVOK")
    assert "CSVOK" in text


def test_corrupt_pdf_returns_empty_string_without_crashing():
    # Un contenu non-PDF avec une extension .pdf ne doit pas lever d'exception.
    text = extract_text("broken.pdf", b"ceci n'est pas un vrai PDF")
    assert text == ""
