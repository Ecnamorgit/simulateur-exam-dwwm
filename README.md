# Simulateur d'examen blanc DWWM

Application web de simulation de l'épreuve de certification du Titre Professionnel
**Développeur Web et Web Mobile** (RNCP 37674). Elle reproduit le déroulé officiel de
l'épreuve (**2 h 00**) et fournit des outils d'entraînement, avec évaluation par IA
(et repli hors-ligne).

## Fonctionnalités

- **Déroulé complet de l'épreuve (2 h)** : les 4 épreuves officielles, enchaînables en examen blanc.
  1. **Soutenance** (35 min) — présentation chronométrée, évaluée par un jury IA (phases, score, questions personnalisées).
  2. **Entretien technique** (40 min) — examinateur IA interactif, questions issues de la soutenance en priorité.
  3. **Questionnaire professionnel** (30 min) — documentation technique en anglais + 2 QCU en français + 2 questions ouvertes en anglais.
  4. **Entretien final** (15 min) — échange non technique (métier, posture, DP, motivation).
- **Bilan d'examen blanc** : synthèse des 4 épreuves, verdict indicatif, sauvegarde et **historique** avec graphique de progression, **export PDF**.
- **Analyse réelle du dossier de projet** : extraction PDF/DOCX/MD/TXT, grille conforme au sommaire officiel (10 rubriques + détection du résumé anglais).
- **Authentification** (JWT + bcrypt) : chaque candidat·e retrouve ses sessions et ses **badges de compétences**.
- **Outils de révision** : QCM technique par domaine, banque de questions du jury, fiches OWASP, backlog agile (Kanban).
- **Synthèse vocale** des questions du jury (edge-tts) + reconnaissance vocale (Web Speech, avec repli clavier).

> Feuille de route : [`PLAN_DEVELOPPEMENT.md`](PLAN_DEVELOPPEMENT.md).

---

## Stack technique

| Côté | Technologies |
|---|---|
| **Backend** | Python 3.12, FastAPI, SQLAlchemy 2 (async) + aiosqlite, JWT (python-jose), bcrypt (passlib), slowapi, pypdf, python-docx, edge-tts |
| **Frontend** | React 18, TypeScript, Vite, lucide-react |
| **IA** | API Google Gemini (repli Ollama, puis banque locale / questionnaires statiques) |
| **Base de données** | SQLite (async via `aiosqlite`) |
| **Tests** | pytest (+ couverture) côté back, Vitest + Testing Library côté front |
| **Déploiement** | Docker / Docker Compose, GitHub Actions (CI) |

---

## Démarrage rapide (Docker)

Prérequis : **Docker Desktop** démarré.

```bash
export GEMINI_API_KEY="votre_cle"     # optionnel (PowerShell : $env:GEMINI_API_KEY="...")
docker compose up --build
```

- Application : http://localhost:3000 — API/Swagger : http://localhost:8000/docs

Détails et variables d'environnement : [`docs/deploiement.md`](docs/deploiement.md).

---

## Installation manuelle

### Prérequis
- **Python** ≥ 3.10 (développé sous 3.12), **Node.js** ≥ 18 et **npm**
- (Optionnel) une **clé API Google Gemini** : https://aistudio.google.com/apikey — sans clé valide, l'app bascule sur les repli hors-ligne.

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\Activate.ps1        # macOS/Linux : source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env             # Windows : copy .env.example .env
# éditer .env : GEMINI_API_KEY, JWT_SECRET
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Ouvrez **http://localhost:3000** (les appels `/api` sont proxifiés vers le backend).

---

## Tests

```bash
# Backend (couverture ≥ 60 %)
cd backend && ../venv/Scripts/python.exe -m pytest -q --cov=app --cov-report=term
# (avec un venv activé : pip install -r requirements-dev.txt puis pytest)

# Frontend
cd frontend && npm run test
```

Jeu d'essai documenté : [`docs/jeu_essai.md`](docs/jeu_essai.md).

---

## Architecture des dossiers

```
.
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI, CORS, rate limiting, montage des routes
│   │   ├── core/                   # config (pydantic-settings), security (JWT/bcrypt), rate_limit
│   │   ├── api/routes/             # certification, auth, badges
│   │   ├── db/sqlite.py            # moteur async + modèles (User, ExamSession, Badge, ...)
│   │   └── services/               # oral_evaluator, question_generator, document_parser,
│   │       │                       #   dossier_checker, questionnaire_generator, entretien_final, tts_service
│   ├── tests/                      # pytest (+ fixtures)
│   ├── Dockerfile
│   └── requirements*.txt
├── frontend/
│   ├── src/
│   │   ├── pages/CertificationSimulator.tsx   # orchestrateur (~290 lignes)
│   │   ├── components/exam/         # OralTab/JuryMode, QcmTab, InteractiveExaminer, ExamOverview,
│   │   │                            #   EntretienTechnique, QuestionnairePro, EntretienFinal, ExamBlancBilan, AuthBar, ...
│   │   ├── hooks/                   # useExamTimer, useTts, useQcm, useDossier, useSoutenance,
│   │   │                            #   useInteractiveExam, useQuestionnaire, useEntretienFinal, useExamBlanc, useAuth
│   │   ├── services/api.ts          # tous les appels réseau centralisés
│   │   └── data/, types/
│   ├── Dockerfile + nginx.conf
│   └── vite.config.ts
├── docs/                           # mcd_mld.md, jeu_essai.md, deploiement.md
├── docker-compose.yml
└── .github/workflows/ci.yml
```

---

## Principaux endpoints (`/api`)

| Méthode | Route | Rôle |
|---|---|---|
| `POST` | `/auth/register`, `/auth/login` | Inscription / connexion (JWT) |
| `POST` | `/certification/upload` | Analyse réelle du dossier de projet |
| `POST` | `/certification/oral-evaluate` | Évaluer une réponse orale |
| `POST` | `/certification/soutenance-evaluate` | Évaluer la soutenance (35 min) |
| `GET`  | `/certification/questionnaire` | Questionnaire pro (doc EN + QCU + ouvertes) |
| `POST` | `/certification/questionnaire-evaluate` | Corriger le questionnaire |
| `GET`  | `/certification/entretien-final-questions` | Questions de l'entretien final |
| `POST` | `/certification/entretien-final-evaluate` | Évaluer l'entretien final |
| `GET`/`POST` | `/certification/sessions` | Historique / sauvegarde (**authentifié**) |
| `GET`  | `/badges`, `/badges/me` | Badges de compétences (relation N:N) |
| `GET`  | `/certification/tts` | Synthèse vocale |

Documentation complète et interactive : **http://localhost:8000/docs**.

---

## Sécurité

- Ne commitez **jamais** votre fichier `.env` (ignoré par `.gitignore`).
- Changez `JWT_SECRET` en production.
- En cas de fuite de la clé Gemini, révoquez-la sur https://aistudio.google.com/apikey.
- Mots de passe **hachés bcrypt** ; endpoints sensibles protégés par JWT et rate limiting.

## Modèle de données

MCD / MLD (Mermaid + DBML) et contraintes d'intégrité : [`docs/mcd_mld.md`](docs/mcd_mld.md).
