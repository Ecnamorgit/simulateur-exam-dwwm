"""
Référentiel Officiel DWWM (RNCP 37674) - Base de Connaissances RAG & Grille d'Évaluation.

Définit les compétences officielles du Titre Professionnel Développeur Web et Web Mobile
(Version mai 2023) ainsi que le barème d'évaluation strict utilisé par le jury IA.
"""

DWWM_REAC_PROMPT = """
RÉFÉRENTIEL OFFICIEL ET D'ÉVALUATION DU TITRE DWWM (RNCP 37674) :

1. COMPÉTENCES FRONT-END (CCP 1 / AT 1) :
   - C1 : Maquetter une application (Wireframes, Zoning, Figma, Responsive, Ergonomie UX/UI, Charte graphique).
   - C2 : Réaliser une interface web statique et adaptable (HTML5 sémantique, CSS3 Flexbox/Grid, Accessibilité RGAA/WCAG).
   - C3 : Développer une interface web dynamique (JavaScript ES6+, Manipulation du DOM, Asynchrone/Fetch/Axios, Framework React/Vue, Hooks, État).
   - C4 : Réaliser une interface avec un CMS (WordPress, intégration et personnalisation).

2. COMPÉTENCES BACK-END (CCP 2 / AT 2) :
   - C5 : Créer une base de données (MCD/MLD, Merise, Modélisation relationnelle, Script SQL CREATE/ALTER, SGBD PostgreSQL/MySQL/SQLite, NoSQL MongoDB).
   - C6 : Développer les composants d'accès aux données (ORM SQLAlchemy/Prisma, requêtes préparées, transactions, intégrité référentielle, CRUD).
   - C7 : Développer la partie back-end d'une application (API RESTful, FastAPI/Express/Nest, Architecture MVC/Layered, Routage, Middleware, Validation Pydantic).
   - C8 : Élaborer une documentation de déploiement (Docker, Dockerfile, Nginx, Variables d'environnement, CI/CD, README technique).

3. COMPÉTENCES TRANSVERSALES & SÉCURITÉ :
   - Sécurité (OWASP Top 10, Injection SQL, XSS, CSRF, Hachage Bcrypt/Argon2, Authentification JWT, CORS, HTTPS, Sanitisation).
   - Qualité & Tests (Tests unitaires pytest/Jest, Tests d'intégration, Jeux d'essai avec données en entrée et résultats attendus/obtenus).
   - RGPD & Droit (Protection des données personnelles, mentions légales, consentement).
   - Gestion de Projet & Veille (Méthodologie Agile/Scrum/Kanban, User Stories, Planning, Veille technologique, Anglais technique B1).

DIRECTIVES DE NOTATION DU JURY EXIGANT (INTRANSIGEANCE TOTALE) :
- ZÉRO POINT (0 / 100 OU 0 / 10) : Si la réponse ou la présentation est absurde, hors-sujet, répétitive (ex: mots au hasard comme 'neige soleil'), ou dépourvue de toute substance technique liée au développement web.
- PÉNALITÉ DE DURÉE : La soutenance officielle dure 35 minutes. Si la durée est inférieure à 5 minutes (< 300 s), time_management_score = 0 et overall_score <= 10. Si la durée < 15 min, time_management_score <= 25.
- ATTRIBUTION DES POINTS :
  * 0 - 20 : Présentation bidon, absurde, répétitive ou sans aucun contenu technique.
  * 21 - 49 : Présentation très insuffisante ou trop superficielle (compétences DWWM non démontrées).
  * 50 - 69 : Présentation passable mais lacunaire (manque de précision sur le back-end, la BDD ou la sécurité).
  * 70 - 89 : Bonne prestation conforme au référentiel DWWM.
  * 90 - 100 : Prestation excellente, maîtrise technique irréprochable sur l'ensemble du stack.
"""
