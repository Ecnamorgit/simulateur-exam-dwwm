# Rapport d'analyse — Simulateur d'examen blanc DWWM (RNCP 37674)

Analyse du projet au regard du référentiel officiel du Titre Professionnel Développeur Web et Web Mobile (RNCP 37674, version mai 2023).

---

## 1. Rappel du référentiel officiel (RC DWWM)

L'épreuve de certification dure **2 h 00 au total** et se décompose ainsi :

| Épreuve | Durée officielle | Présent dans l'app ? |
|---|---|---|
| Présentation du projet (soutenance) | **35 min** | ✅ Timer 35 min correct |
| Entretien technique | **40 min** | ⚠️ Mode "interactif" existe mais non calibré (10 questions, pas de timer 40 min) |
| Questionnaire professionnel | **30 min** | ❌ Non conforme (voir §2) |
| Entretien final | **15 min** | ❌ Absent |

Le titre est composé de 2 activités types (ex-CCP) :
- **AT1 — Front-end** : maquettage, interfaces statiques/adaptables, interfaces dynamiques (JS/frameworks).
- **AT2 — Back-end** : BDD relationnelle, composants d'accès aux données **SQL et NoSQL**, composants métier côté serveur, documentation de déploiement DevOps.

Compétences transversales évaluées en continu : sécurité (OWASP), RGPD, accessibilité (RGAA), veille, anglais (niveau B1 compréhension).

---

## 2. Écarts de conformité majeurs

### 2.1 Questionnaire professionnel non conforme
L'épreuve réelle n'est **pas un QCM technique en français**. Le candidat étudie une **documentation technique rédigée en anglais** puis répond à :
- 2 questions fermées à choix unique posées **en français** ;
- 2 questions ouvertes posées **en anglais**, avec réponse rédigée **en anglais**.

Le mode QCM actuel (10 questions techniques FR) est un bon outil de révision, mais il ne simule pas l'épreuve. **À ajouter :** un mode "Questionnaire professionnel" avec extrait de doc anglaise + 2 QCU FR + 2 questions ouvertes EN, chronométré 30 min.

### 2.2 Entretien final absent
15 min portant sur la compréhension du métier, la culture professionnelle, le parcours et le **Dossier Professionnel (DP)** — distinct du dossier de projet. Aucune simulation de cet entretien ni de vérification du DP.

### 2.3 Analyse du dossier de projet peu fiable
`certification.py /upload` décode le fichier binaire en UTF-8 et cherche des mots-clés :
- Un **PDF est compressé** (flate) : le texte n'apparaît quasiment jamais dans les octets bruts → les détections MCD/RGPD/veille/tests sont **quasi aléatoires**, et le score (base 60 + 4×10) n'a pas de valeur.
- Les critères vérifiés ne correspondent pas au sommaire attendu du dossier de projet (RC) : liste des compétences mises en œuvre, cahier des charges/expression des besoins, gestion de projet, maquettes et enchaînement des maquettes, captures des interfaces, **extraits de code significatifs (front et back)**, éléments de sécurité, **jeu d'essai** (données, résultats attendus/obtenus), veille, et **résumé en anglais (obligatoire)**.

**À faire :** extraire réellement le texte (pypdf/pdfplumber pour PDF, python-docx pour DOCX), vérifier le sommaire officiel section par section, et contrôler la présence du résumé anglais.

### 2.4 Points conformes
- Timer de soutenance 35 min ✅
- Grille d'évaluation de soutenance par phases (contexte, UX/UI, démo, architecture/BDD, sécurité/bilan) : pertinente ✅
- Banque de questions fallback : bonne couverture des domaines du REAC (HTML/CSS, JS, React, UX, accessibilité, BDD, API, sécurité, OWASP, RGPD, DevOps, agilité, tests, veille), contenus exacts ✅
- Questions générées personnalisées selon la stack du candidat : bonne idée, dans l'esprit de l'entretien technique ✅

---

## 3. Le projet lui-même face aux compétences DWWM

Si ce projet sert de **projet de soutenance** de l'élève, plusieurs compétences du référentiel ne sont pas démontrées :

| Compétence attendue | État |
|---|---|
| BDD relationnelle avec relations et intégrité | ⚠️ 3 tables, relations simples 1:N — pas de N:N, pas de MCD/MLD documenté |
| Authentification sécurisée (bcrypt, JWT, contrôle d'accès) | ❌ Aucune auth : API entièrement ouverte |
| Accès NoSQL | ❌ Absent |
| Plan de tests / jeu d'essai | ❌ Aucun test (pytest, Vitest) dans le repo |
| Documentation de déploiement (Docker, CI/CD) | ❌ Pas de Dockerfile, pas de CI, pas de README |
| Sécurisation (OWASP) | ⚠️ CORS ok, ORM ok, mais endpoints sans limite ni auth |

C'est paradoxal : l'app pose des questions sur bcrypt, JWT, tests et Docker… sans les implémenter. Le jury le relèvera immédiatement.

---

## 4. Revue technique (qualité du code)

### Sécurité — à corriger en priorité
1. **`.env` avec la clé Gemini est dans le repo** : la retirer, la révoquer, ajouter un `.gitignore` (`.env`, `venv/`, `__pycache__/`, `node_modules/`, `dist/`, `*.db`).
2. Clé API passée en **query string** vers Gemini (loggable) — utiliser l'en-tête `x-goog-api-key`.
3. `/upload` sans limite de taille ni validation de type MIME.
4. `/tts` est un proxy TTS ouvert (abus possible) ; pas de rate limiting.
5. `echo=True` sur le moteur SQLAlchemy : logs SQL verbeux en prod.

### Backend
- `speech_fallback.py` retourne une **transcription factice codée en dur** : soit implémenter (Whisper/faster-whisper), soit supprimer l'endpoint `/transcribe`.
- Schemas Pydantic (`CriteriaResultSchema`, `GeneratedQuestionSchema`) déclarés mais jamais utilisés ; les brancher comme `response_model` pour valider/documenter l'API.
- `datetime.utcnow` est déprécié → `datetime.now(timezone.utc)`.
- `urllib.request` synchrone dans un thread : préférer `httpx.AsyncClient` (déjà async-native, timeout propre, retries).
- Pas de gestion d'erreur JSON robuste : `_parse_soutenance_json` retourne le dict brut sans valider la structure (contrairement à `_parse_evaluation`) → risque de crash front.

### Frontend
- `CertificationSimulator.tsx` fait **1270 lignes** : découper en composants (`OralTab`, `QcmTab`, `InteractiveExaminer`, `SoutenanceModal`, `DossierChecker`, `KanbanBoard`) et extraire la logique dans des hooks (`useSoutenance`, `useInteractiveExam`).
- En cas d'échec de l'upload, le front affiche un **score aléatoire** (`Math.random()`) présenté comme une analyse : trompeur — afficher une erreur claire à la place.
- Web Speech API : prévoir le fallback si `hasSupport` est faux (Firefox).

### Hygiène du dépôt
`venv/`, `__pycache__/`, `dist/`, `node_modules/`, `dwwm_simulator.db` et `.env` sont versionnés. Nettoyer avec `git rm -r --cached` + `.gitignore`. Ajouter un **README** (installation, lancement, architecture) — c'est aussi une compétence évaluée (documentation).

---

## 5. Plan d'action priorisé

1. **Sécurité immédiate** : révoquer la clé Gemini, `.gitignore`, purge du repo.
2. **Conformité épreuve** : ajouter les 3 épreuves manquantes/incomplètes → entretien technique chronométré 40 min, questionnaire professionnel (doc EN + 2 QCU FR + 2 ouvertes EN, 30 min), entretien final 15 min. Afficher le déroulé complet 2 h.
3. **Analyse de dossier réelle** : extraction texte PDF/DOCX + vérification du sommaire officiel + résumé anglais.
4. **Compétences à démontrer** : auth JWT + bcrypt, une relation N:N, tests pytest + Vitest, Dockerfile + GitHub Actions, README.
5. **Refactoring front** : découpage en composants, suppression du score aléatoire.
6. **Nice to have** : remplacer le fallback keyword-matching de notation par un barème transparent, historique de progression par domaine, export PDF du bilan.

---

## Sources
- [France Compétences — RNCP 37674](https://www.francecompetences.fr/recherche/rncp/37674/)
- [Référentiel d'évaluation DWWM (REV2_DWWM_V04, mai 2023)](https://www.dataos.com/wp-content/uploads/2023/09/REV2_DWWM_V04_24052023.pdf)
- [Résumé du titre professionnel DWWM — memento-dev.fr](https://memento-dev.fr/certifications/dwwm)
