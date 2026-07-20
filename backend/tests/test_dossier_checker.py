"""Tests de la grille d'analyse du dossier (app.services.dossier_checker)."""

from app.services.dossier_checker import analyze_dossier, _has_english_summary

COMPLETE_DOSSIER = """
Liste des compétences AT1 et AT2 du référentiel mises en œuvre dans le projet.
Cahier des charges et expression des besoins, avec des user stories détaillées.
Gestion de projet en méthode agile Scrum, avec un planning et des sprints.
Maquettes réalisées sous Figma avec l'enchaînement des maquettes (navigation).
Captures d'écran des interfaces et extraits de code React en HTML et CSS.
MCD et MLD de la base de données, script SQL create table, code back-end API REST.
Sécurité : analyse OWASP, injection SQL, XSS, hachage bcrypt et HTTPS.
Jeu d'essai : données de test, résultats attendus et obtenus, cas de test.
Veille technologique organisée avec des flux RSS Feedly et des newsletters.

Abstract: This project is a web application developed with React and FastAPI.
The database is managed with SQLite and the code is secured with good practices.
We have implemented authentication and we are proud of the result for our users.
"""

FRENCH_ONLY = (
    "Ce projet est une application web développée avec des technologies modernes. "
    "La base de données est gérée localement et le code respecte les bonnes pratiques. "
    "Nous avons mis en place une authentification pour protéger les utilisateurs du site."
)

ENGLISH_PARAGRAPH_NO_HEADING = (
    "This project is a web application developed with React and FastAPI. "
    "The database is managed with SQLite and the code is secured with best practices. "
    "We have implemented authentication and we are proud of the result for our users and the team."
)


def test_complete_dossier_detects_all_criteria():
    result = analyze_dossier(COMPLETE_DOSSIER)
    unchecked = [c["name"] for c in result["criteria"] if not c["checked"]]
    assert unchecked == [], f"Critères non détectés à tort : {unchecked}"
    assert result["score"] == 100


def test_empty_dossier_detects_nothing():
    result = analyze_dossier("")
    assert all(not c["checked"] for c in result["criteria"])
    assert result["score"] == 0


def test_ten_criteria_present():
    result = analyze_dossier(COMPLETE_DOSSIER)
    assert len(result["criteria"]) == 10
    assert result["criteria"][-1]["name"].startswith("Résumé en anglais")


def test_english_summary_detected_with_heading():
    assert _has_english_summary(COMPLETE_DOSSIER) is True


def test_english_summary_detected_without_heading():
    assert _has_english_summary(ENGLISH_PARAGRAPH_NO_HEADING) is True


def test_english_summary_not_detected_on_french_text():
    assert _has_english_summary(FRENCH_ONLY) is False


def test_feedback_cites_referentiel_when_missing():
    result = analyze_dossier("")
    # Chaque critère manquant doit expliquer ce que le référentiel attend.
    for c in result["criteria"]:
        assert c["feedback"], "Feedback vide"
    joined = " ".join(c["feedback"] for c in result["criteria"]).lower()
    assert "référentiel" in joined or "referentiel" in joined
