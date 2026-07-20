"""
Analyse du dossier de projet selon le sommaire officiel attendu par le
référentiel DWWM (RNCP 37674).

Remplace l'ancienne grille arbitraire (4 critères + base 60) par la checklist
des 10 rubriques attendues dans le dossier de projet, chacune détectée par
mots-clés dans le texte réellement extrait, avec un feedback citant ce que le
référentiel attend.
"""

import re
from dataclasses import dataclass


@dataclass
class Criterion:
    name: str
    keywords: list[str]
    feedback_ok: str
    feedback_missing: str
    weight: int = 10


# Les 10 rubriques du sommaire officiel du dossier de projet.
CRITERIA: list[Criterion] = [
    Criterion(
        name="Liste des compétences mises en œuvre",
        keywords=["compétence", "competence", "at1", "at2", "ccp", "référentiel", "referentiel", "reac"],
        feedback_ok="La liste des compétences du référentiel (AT1/AT2) mises en œuvre est présente.",
        feedback_missing="Le référentiel attend une liste explicite des compétences (AT1 front-end / AT2 back-end) mises en œuvre dans le projet.",
    ),
    Criterion(
        name="Cahier des charges / expression des besoins",
        keywords=["cahier des charges", "expression des besoins", "expression du besoin", "besoin", "user story", "user stories", "spécification", "specification"],
        feedback_ok="L'expression des besoins / cahier des charges est documentée.",
        feedback_missing="Le dossier doit présenter l'expression des besoins (cahier des charges, user stories, fonctionnalités attendues).",
    ),
    Criterion(
        name="Gestion de projet (méthode, planning)",
        keywords=["gestion de projet", "planning", "agile", "scrum", "kanban", "trello", "jira", "sprint", "gantt", "rétroplanning", "retroplanning"],
        feedback_ok="La méthode de gestion de projet et le planning sont décrits.",
        feedback_missing="Le référentiel attend la description de la méthode de gestion de projet (agile/Scrum/Kanban) et un planning (Gantt, sprints).",
    ),
    Criterion(
        name="Maquettes et enchaînement des maquettes",
        keywords=["maquette", "wireframe", "figma", "adobe xd", "prototype", "zoning", "enchaînement", "enchainement"],
        feedback_ok="Les maquettes et leur enchaînement sont présentés.",
        feedback_missing="Le dossier doit inclure les maquettes des interfaces ET leur enchaînement (navigation entre écrans).",
    ),
    Criterion(
        name="Captures des interfaces + extraits de code front",
        keywords=["capture", "screenshot", "copie d'écran", "extrait de code", "code front", "html", "css", "javascript", "typescript", "react", "vue", "angular"],
        feedback_ok="Des captures d'interfaces et/ou des extraits de code front-end significatifs sont présents.",
        feedback_missing="Le référentiel attend des captures d'écran des interfaces et des extraits de code front-end significatifs (HTML/CSS/JS).",
    ),
    Criterion(
        name="MCD/MLD + script BDD + extraits de code back",
        keywords=["mcd", "mld", "merise", "modèle conceptuel", "modele conceptuel", "modèle logique", "modele logique", "script sql", "create table", "base de données", "base de donnees", "requête sql", "requete sql", "code back", "backend", "api rest"],
        feedback_ok="La modélisation des données (MCD/MLD), le script BDD et/ou des extraits de code back-end sont présents.",
        feedback_missing="Le référentiel attend le MCD/MLD, le script de création de la base et des extraits de code back-end significatifs.",
    ),
    Criterion(
        name="Éléments de sécurité (OWASP, mesures appliquées)",
        keywords=["owasp", "sécurit", "securit", "injection sql", "xss", "csrf", "bcrypt", "hachage", "https", "authentification", "faille", "vulnérab", "vulnerab"],
        feedback_ok="Les éléments de sécurité (OWASP, mesures appliquées) sont documentés.",
        feedback_missing="Le référentiel attend une partie sécurité : risques OWASP identifiés et mesures concrètes appliquées (hachage, validation, HTTPS...).",
    ),
    Criterion(
        name="Jeu d'essai (données, résultats attendus/obtenus)",
        keywords=["jeu d'essai", "jeu d essai", "jeux d'essai", "cas de test", "résultat attendu", "resultat attendu", "résultats attendus", "données de test", "donnees de test", "scénario de test", "scenario de test", "plan de test"],
        feedback_ok="Un jeu d'essai (données, résultats attendus/obtenus) est présenté.",
        feedback_missing="Le référentiel attend un jeu d'essai : données en entrée, résultats attendus et résultats obtenus.",
    ),
    Criterion(
        name="Veille technologique",
        keywords=["veille technologique", "veille", "flux rss", "feedly", "inoreader", "curation", "newsletter", "google alerts"],
        feedback_ok="La démarche de veille technologique est décrite.",
        feedback_missing="Le référentiel attend une description de la veille technologique (outils, sources, périodicité).",
    ),
    # Le 10e critère (résumé en anglais) est traité à part via _has_english_summary.
]


ENGLISH_SUMMARY_CRITERION = Criterion(
    name="Résumé en anglais (obligatoire)",
    keywords=[],  # détecté par analyse linguistique, pas par mots-clés
    feedback_ok="Un résumé rédigé en anglais est présent (obligatoire au référentiel).",
    feedback_missing="Le référentiel rend OBLIGATOIRE un résumé du projet rédigé en anglais : il est introuvable dans le dossier.",
)


# Mots outils très fréquents en anglais et rares en français : bons discriminants.
_ENGLISH_STOPWORDS = {
    "the", "and", "is", "are", "was", "were", "this", "that", "these", "those",
    "with", "of", "to", "for", "we", "our", "which", "has", "have", "been",
    "it", "its", "as", "by", "from", "on", "in", "an", "will", "can", "using",
}

_WORD_RE = re.compile(r"[a-zA-Zàâäéèêëïîôöùûüç']+")


def _has_english_summary(text: str) -> bool:
    """
    Détecte la présence d'une section majoritairement anglophone (résumé/abstract).

    Stratégie :
      1. Un intitulé explicite ("abstract", "english summary", "résumé en anglais"...)
         suffit à considérer la section présente.
      2. Sinon, on cherche une fenêtre glissante de mots contenant une densité
         élevée de mots-outils anglais (rares en français).
    """
    lower = text.lower()

    explicit_headings = [
        "abstract", "english summary", "summary in english",
        "résumé en anglais", "resume en anglais", "in english",
    ]
    if any(h in lower for h in explicit_headings):
        return True

    words = [w.lower() for w in _WORD_RE.findall(text)]
    if len(words) < 30:
        return False

    window = 40
    for i in range(0, len(words) - window + 1, 10):
        chunk = words[i:i + window]
        english_hits = sum(1 for w in chunk if w in _ENGLISH_STOPWORDS)
        distinct = len({w for w in chunk if w in _ENGLISH_STOPWORDS})
        # Une vraie phrase anglaise dépasse largement ces seuils ;
        # un texte français reste bien en dessous.
        if english_hits >= window * 0.15 and distinct >= 5:
            return True
    return False


def analyze_dossier(text: str) -> dict:
    """
    Analyse le texte extrait du dossier et retourne un score (0-100) et la liste
    des critères (name, checked, feedback), incluant le résumé anglais.
    """
    lower = (text or "").lower()

    results = []
    total_weight = 0
    obtained_weight = 0

    for crit in CRITERIA:
        total_weight += crit.weight
        detected = any(kw in lower for kw in crit.keywords)
        if detected:
            obtained_weight += crit.weight
        results.append({
            "name": crit.name,
            "checked": detected,
            "feedback": crit.feedback_ok if detected else crit.feedback_missing,
        })

    # 10e critère : résumé en anglais
    total_weight += ENGLISH_SUMMARY_CRITERION.weight
    has_english = _has_english_summary(text or "")
    if has_english:
        obtained_weight += ENGLISH_SUMMARY_CRITERION.weight
    results.append({
        "name": ENGLISH_SUMMARY_CRITERION.name,
        "checked": has_english,
        "feedback": ENGLISH_SUMMARY_CRITERION.feedback_ok if has_english else ENGLISH_SUMMARY_CRITERION.feedback_missing,
    })

    score = round(100 * obtained_weight / total_weight) if total_weight else 0

    return {"score": score, "criteria": results}
