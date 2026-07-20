# Déploiement

## 1. Lancement avec Docker Compose (recommandé)

Prérequis : **Docker Desktop** installé et **démarré**.

```bash
# À la racine du projet
# (optionnel) exporter votre clé Gemini pour activer l'IA en ligne
export GEMINI_API_KEY="votre_cle"      # Windows PowerShell : $env:GEMINI_API_KEY="votre_cle"

docker compose up --build
```

- Frontend : http://localhost:3000
- Backend (API + Swagger) : http://localhost:8000/docs

L'application complète (frontend nginx + backend FastAPI) démarre dans deux conteneurs.
Le frontend sert les fichiers statiques et **proxifie `/api`** vers le backend via nginx.
La base SQLite est persistée dans le volume Docker `backend_data`.

Arrêt :

```bash
docker compose down          # arrêt
docker compose down -v       # arrêt + suppression du volume (réinitialise la BDD)
```

### Variables d'environnement (service backend)

| Variable | Défaut | Rôle |
|---|---|---|
| `GEMINI_API_KEY` | *(vide)* | Clé API Gemini ; si absente/invalide, l'app bascule sur les fallbacks |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Modèle Gemini |
| `JWT_SECRET` | `dev-secret-...` | **À changer en production** (longue chaîne aléatoire) |
| `DATABASE_URL` | SQLite dans `/app/data` | Base de données |
| `CORS_ORIGINS` | `localhost:3000,...` | Origines autorisées |

## 2. Architecture des images

- **backend/Dockerfile** : `python:3.12-slim`, installe `requirements.txt`, lance `uvicorn`.
- **frontend/Dockerfile** : build multi-étapes — `node:20-alpine` construit le bundle Vite, puis `nginx:alpine` le sert (voir `frontend/nginx.conf`).

## 3. Intégration continue (GitHub Actions)

Le workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) s'exécute à chaque push et pull request :

- **backend** : installe les dépendances et lance `pytest` avec la couverture ;
- **frontend** : `npm ci`, vérification des types (`tsc --noEmit`), tests (`vitest`) et build.

Un test cassé (back ou front) fait échouer le workflow → **CI rouge**.

> Le badge CI apparaît une fois le dépôt poussé sur GitHub. Ajoutez alors dans le README :
> `![CI](https://github.com/<user>/<repo>/actions/workflows/ci.yml/badge.svg)`

## 4. Déploiement manuel (sans Docker)

Voir le [README](../README.md) — installation backend (venv + uvicorn) et frontend (`npm run build` + service statique).
