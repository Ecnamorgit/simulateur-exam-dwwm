# Tutoriel — Installer, publier et lancer le Simulateur DWWM

Guide pas-à-pas pour **publier ce projet sur GitHub** et le **lancer** (avec ou sans Docker).
Pensé pour être suivi de bout en bout, y compris par une personne qui découvre le projet.

- [1. Ce que fait le projet](#1-ce-que-fait-le-projet)
- [2. Prérequis](#2-prérequis)
- [3. Publier le projet sur GitHub](#3-publier-le-projet-sur-github)
- [4. Lancer avec Docker (le plus simple)](#4-lancer-avec-docker-le-plus-simple)
- [5. Lancer sans Docker (mode développement)](#5-lancer-sans-docker-mode-développement)
- [6. Configurer la clé Gemini](#6-configurer-la-clé-gemini)
- [7. Utiliser l'application](#7-utiliser-lapplication)
- [8. Lancer les tests](#8-lancer-les-tests)
- [9. Workflow Git du projet](#9-workflow-git-du-projet)
- [10. Dépannage](#10-dépannage)

---

## 1. Ce que fait le projet

Un **simulateur d'examen blanc** pour le Titre Professionnel *Développeur Web et Web Mobile*
(RNCP 37674). Il reproduit le déroulé officiel de l'épreuve (**2 h**) :

1. **Soutenance** (35 min) évaluée par un jury IA
2. **Entretien technique** (40 min) interactif
3. **Questionnaire professionnel** (30 min : doc anglaise + QCU français + questions ouvertes anglaises)
4. **Entretien final** (15 min, non technique)

Plus : analyse réelle du dossier de projet (PDF/DOCX), authentification, badges de compétences,
bilan d'examen blanc exportable en PDF.

**Stack** : FastAPI (Python) · React + TypeScript (Vite) · SQLite · Docker · GitHub Actions.

---

## 2. Prérequis

Selon la méthode de lancement choisie :

| Outil | Pour quoi | Lien |
|---|---|---|
| **Git** | Versionner et publier | https://git-scm.com/downloads |
| **Docker Desktop** | Lancer tout en une commande (méthode 4) | https://www.docker.com/products/docker-desktop/ |
| **Python** ≥ 3.10 | Lancement manuel du backend (méthode 5) | https://www.python.org/downloads/ |
| **Node.js** ≥ 18 | Lancement manuel du frontend (méthode 5) | https://nodejs.org/ |
| Un **compte GitHub** | Héberger le code | https://github.com/signup |

Vérifier une installation :

```bash
git --version
docker --version          # méthode Docker
python --version          # méthode manuelle
node --version            # méthode manuelle
```

---

## 3. Publier le projet sur GitHub

Le projet est déjà un dépôt Git local (avec un historique de commits propre). Il reste à
le pousser sur GitHub. Deux méthodes.

### Méthode A — via l'interface GitHub (recommandée pour débuter)

1. Sur https://github.com/new, créez un dépôt **vide** (sans README ni .gitignore),
   par exemple `simulateur-dwwm`. Notez son URL, ex. `https://github.com/Ecnamorgit/simulateur-exam-dwwm.git`.
2. Dans un terminal, à la racine du projet :

```bash
# (Optionnel) renommer la branche locale en main
git branch -M main

# Relier le dépôt local à GitHub
git remote add origin https://github.com/Ecnamorgit/simulateur-exam-dwwm.git

# Envoyer le code
git push -u origin main
```

### Méthode B — via GitHub CLI (`gh`)

```bash
gh auth login                       # connexion (une seule fois)
gh repo create simulateur-exam-dwwm --public --source=. --remote=origin --push
```

### Après le push

- Le code est en ligne. ✅
- Le workflow **CI** (`.github/workflows/ci.yml`) se lance automatiquement : onglet **Actions**
  du dépôt. Il exécute les tests backend + frontend à chaque push.
- Ajoutez le **badge CI** en haut du `README.md` (remplacez `VOTRE_PSEUDO` / `simulateur-dwwm`) :

```markdown
![CI](https://github.com/Ecnamorgit/simulateur-exam-dwwm/actions/workflows/ci.yml/badge.svg)
```

> ⚠️ Le fichier `.env` (qui contient votre clé API) est **ignoré par Git** et n'est jamais
> publié — c'est voulu. Ne le committez jamais.

---

## 4. Lancer avec Docker (le plus simple)

Une seule commande lance le frontend **et** le backend.

1. Installez et **démarrez Docker Desktop** (l'icône baleine doit être active).
2. À la racine du projet :

```bash
# (Optionnel) fournir votre clé Gemini pour activer l'IA en ligne
export GEMINI_API_KEY="votre_cle"     # Windows PowerShell : $env:GEMINI_API_KEY="votre_cle"

docker compose up --build
```

3. Ouvrez :
   - Application : **http://localhost:3000**
   - API + documentation Swagger : **http://localhost:8000/docs**

Pour arrêter : `Ctrl+C`, puis `docker compose down` (ajoutez `-v` pour aussi réinitialiser la base).

> Sans clé Gemini valide, l'application fonctionne quand même : elle bascule sur des
> questionnaires et évaluations de secours (hors-ligne).

---

## 5. Lancer sans Docker (mode développement)

Ouvrez **deux terminaux**.

### Terminal 1 — Backend (port 8000)

```bash
cd backend
python -m venv venv
# Windows (PowerShell) :
venv\Scripts\Activate.ps1
# macOS / Linux :
source venv/bin/activate

pip install -r requirements.txt
copy .env.example .env      # macOS/Linux : cp .env.example .env
# éditez .env : renseignez GEMINI_API_KEY et JWT_SECRET

uvicorn app.main:app --reload --port 8000
```

### Terminal 2 — Frontend (port 3000)

```bash
cd frontend
npm install
npm run dev
```

Ouvrez **http://localhost:3000**. Le frontend proxifie automatiquement `/api` vers le backend.

---

## 6. Configurer la clé Gemini

1. Générez une clé sur **https://aistudio.google.com/apikey**.
2. Vérifiez que l'API **« Generative Language »** est activée sur le projet Google associé,
   et que la clé n'a **aucune restriction** (référents HTTP / adresses IP) — le backend fait
   des appels serveur.
3. Collez-la **uniquement** dans `backend/.env` :

```env
GEMINI_API_KEY=AQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> ⚠️ Ne définissez **pas** `GEMINI_API_KEY` comme variable d'environnement système : elle
> aurait priorité sur le `.env` et pourrait masquer votre bonne clé (voir [Dépannage](#10-dépannage)).

---

## 7. Utiliser l'application

1. **Créez un compte** (barre en haut de la page) : email + mot de passe (8 caractères min).
2. Depuis **« Déroulé de l'épreuve »**, entraînez-vous épreuve par épreuve, ou lancez un
   **examen blanc complet** (les 4 épreuves à la suite).
3. À la fin d'un examen blanc, **enregistrez le bilan** : il apparaît dans l'historique avec
   un **graphique de progression**, et peut être **exporté en PDF**.
4. Réussir un examen blanc débloque un **badge de compétence**.
5. Autres outils : **QCM** par domaine, **entretien IA**, **validation de dossier** (upload
   PDF/DOCX), fiches **OWASP**, **backlog agile**.

---

## 8. Lancer les tests

```bash
# Backend (avec le venv activé et requirements-dev installés)
cd backend
pip install -r requirements-dev.txt
pytest -q --cov=app --cov-report=term      # couverture ≥ 60 %

# Frontend
cd frontend
npm run test
```

Le détail des cas de test est documenté dans [`jeu_essai.md`](jeu_essai.md).

---

## 9. Workflow Git du projet

Le projet a été construit avec une discipline Git démontrable (utile à présenter au jury) :

- **une étape = une branche** `feat/x.y-nom` → **merge** sur la branche principale ;
- commits atomiques et messages explicites (`feat`, `fix`, `test`, `refactor`, `chore`) ;
- intégration continue qui rejoue les tests à chaque push.

Consulter l'historique :

```bash
git log --oneline --graph
```

---

## 10. Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| Gemini : `API_KEY_INVALID` (400) | Clé absente/incomplète, ou API non activée | Vérifier le [§6](#6-configurer-la-clé-gemini) |
| Gemini semble ignorer le `.env` | Une **variable d'environnement système** `GEMINI_API_KEY` masque le `.env` | La supprimer : PowerShell `` [Environment]::SetEnvironmentVariable('GEMINI_API_KEY',$null,'User') ``, puis rouvrir le terminal |
| Gemini : `429 Too Many Requests` | Quota gratuit dépassé | Attendre 1-2 min ; la clé est valide |
| `docker compose` : erreur de connexion au moteur | Docker Desktop n'est pas démarré | Lancer Docker Desktop et réessayer |
| Port 8000 ou 3000 déjà utilisé | Un serveur tourne déjà | Arrêter l'autre processus, ou changer le port |
| Reconnaissance vocale indisponible | Navigateur sans Web Speech (Firefox) | Utiliser Chrome/Edge, ou la **saisie clavier** proposée en repli |
| Le badge CI n'apparaît pas | Le dépôt n'est pas encore poussé sur GitHub | Suivre le [§3](#3-publier-le-projet-sur-github) |

---

Bon entraînement, et bonne certification ! 🎓
