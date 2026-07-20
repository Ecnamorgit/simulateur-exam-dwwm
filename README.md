# Simulateur d'examen blanc DWWM

Application web de simulation de l'épreuve de certification du Titre Professionnel
**Développeur Web et Web Mobile** (RNCP 37674). Elle aide un·e candidat·e à s'entraîner :
soutenance de projet chronométrée, entretien technique interactif, analyse du dossier de
projet, questions personnalisées et synthèse vocale des questions du jury.

> ⚠️ Projet en cours de mise en conformité avec le référentiel officiel.
> Voir [`PLAN_DEVELOPPEMENT.md`](PLAN_DEVELOPPEMENT.md) pour la feuille de route.

---

## Stack technique

| Côté | Technologies |
|---|---|
| **Backend** | Python 3.12, FastAPI, SQLAlchemy 2 (async) + aiosqlite, edge-tts |
| **Frontend** | React 18, TypeScript, Vite, React Router, lucide-react |
| **IA** | API Google Gemini (avec fallback Ollama puis banque de questions locale) |
| **Base de données** | SQLite (local, via `aiosqlite`) |

---

## Prérequis

- **Python** ≥ 3.10 (développé sous 3.12)
- **Node.js** ≥ 18 et **npm**
- Une **clé API Google Gemini** (gratuite) : https://aistudio.google.com/apikey

---

## Installation

### 1. Backend

```bash
cd backend

# Créer et activer un environnement virtuel
python -m venv venv
# Windows (PowerShell)
venv\Scripts\Activate.ps1
# macOS / Linux
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Configurer les variables d'environnement
cp .env.example .env      # (Windows : copy .env.example .env)
# puis éditer .env et renseigner GEMINI_API_KEY
```

### 2. Frontend

```bash
cd frontend
npm install
```

---

## Lancement

Ouvrez **deux terminaux**.

**Terminal 1 — backend** (port 8000) :
```bash
cd backend
venv\Scripts\Activate.ps1        # ou : source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — frontend** (port 3000) :
```bash
cd frontend
npm run dev
```

Puis ouvrez **http://localhost:3000**.
Le frontend proxifie automatiquement les appels `/api` vers le backend (`http://127.0.0.1:8000`).

- Documentation interactive de l'API (Swagger) : **http://localhost:8000/docs**

---

## Architecture des dossiers

```
.
├── backend/
│   ├── app/
│   │   ├── main.py                 # Point d'entrée FastAPI, CORS, montage des routes
│   │   ├── api/routes/
│   │   │   └── certification.py    # Tous les endpoints (/api/...)
│   │   ├── db/
│   │   │   └── sqlite.py           # Moteur SQLAlchemy async + modèles + init
│   │   └── services/
│   │       ├── oral_evaluator.py       # Évaluation soutenance/oral via Gemini
│   │       ├── question_generator.py   # Génération de questions personnalisées
│   │       ├── tts_service.py          # Synthèse vocale (edge-tts)
│   │       └── speech_fallback.py      # Fallback transcription
│   ├── requirements.txt
│   └── .env.example                # Modèle de configuration (à copier en .env)
│
└── frontend/
    ├── src/
    │   ├── index.tsx               # Bootstrap React
    │   ├── App.tsx                 # Routes de l'application
    │   ├── pages/
    │   │   └── CertificationSimulator.tsx   # Écran principal du simulateur
    │   ├── components/             # NavBar, Separator, ...
    │   ├── hooks/
    │   │   └── useSpeechRecognition.ts      # Reconnaissance vocale (Web Speech API)
    │   └── data/
    │       └── dwwmQuestions.ts    # Banque de questions locale
    ├── vite.config.ts              # Config Vite + proxy /api
    └── package.json
```

---

## Principaux endpoints (`/api`)

| Méthode | Route | Rôle |
|---|---|---|
| `POST` | `/upload` | Envoi et analyse du dossier de projet |
| `POST` | `/sessions` | Créer une session d'examen |
| `GET`  | `/sessions` | Lister les sessions |
| `GET`  | `/sessions/{id}/questions` | Questions d'une session |
| `POST` | `/oral-evaluate` | Évaluer une réponse orale |
| `GET`  | `/oral-config` | Configuration de l'oral |
| `POST` | `/soutenance-evaluate` | Évaluer une phase de soutenance |
| `GET`  | `/tts` | Synthèse vocale d'un texte |

---

## Sécurité

- Ne commitez **jamais** votre fichier `.env` : il est ignoré par Git (`.gitignore`).
- En cas de fuite de la clé Gemini, révoquez-la immédiatement sur
  https://aistudio.google.com/apikey et générez-en une nouvelle.
