# Plan de développement — Simulateur DWWM

Plan step-by-step pour mise en conformité avec le référentiel RNCP 37674 et montée en qualité du code.
Règle : **une étape = une branche = une PR**. Chaque étape a des critères de validation (Definition of Done). Ne pas passer à l'étape suivante tant que la DoD n'est pas cochée.

---

## PHASE 0 — Urgence sécurité & hygiène du repo (½ journée)

### Étape 0.1 — Révoquer la clé API exposée
- Aller sur Google AI Studio → supprimer la clé Gemini actuelle → en générer une nouvelle.
- Ne JAMAIS la commiter. La stocker uniquement dans `.env` local.

**DoD :**
- [ ] Ancienne clé révoquée (testée : elle retourne 401)
- [ ] Nouvelle clé fonctionnelle en local uniquement

### Étape 0.2 — Nettoyer le dépôt Git
Créer `.gitignore` à la racine :
```gitignore
.env
venv/
__pycache__/
*.pyc
node_modules/
dist/
*.db
```
Puis retirer du suivi Git :
```bash
git rm -r --cached backend/.env venv backend/app/**/__pycache__ frontend/dist frontend/node_modules backend/dwwm_simulator.db
git commit -m "chore: clean repo, add .gitignore"
```
Créer `backend/.env.example` avec les clés vides (`GEMINI_API_KEY=`).

**DoD :**
- [ ] `git status` ne montre plus aucun fichier généré/secret
- [ ] `.env.example` présent, `.env` absent du repo
- [ ] Un clone frais + suivi du README (étape 0.3) permet de lancer le projet

### Étape 0.3 — README
Rédiger `README.md` : description, stack, prérequis, installation backend (venv, pip, .env), installation frontend (npm), lancement, architecture des dossiers.

**DoD :**
- [ ] Une personne externe peut installer et lancer le projet en suivant uniquement le README

---

## PHASE 1 — Fondations backend (2-3 jours)

### Étape 1.1 — Config centralisée + durcissement
- Créer `backend/app/core/config.py` (pydantic-settings) : `DATABASE_URL`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `CORS_ORIGINS`, `MAX_UPLOAD_SIZE_MB`.
- Passer `echo=False` sur le moteur SQLAlchemy.
- Remplacer `datetime.utcnow` par `datetime.now(timezone.utc)`.
- Envoyer la clé Gemini via l'en-tête `x-goog-api-key` au lieu de la query string.

**DoD :**
- [ ] Aucun `os.getenv` en dehors de `config.py`
- [ ] Plus aucun log SQL au démarrage
- [ ] La clé n'apparaît plus dans aucune URL

### Étape 1.2 — Migrer les appels HTTP vers httpx
- `pip install httpx`, remplacer `urllib.request` dans `oral_evaluator.py` et `question_generator.py` par `httpx.AsyncClient` (supprime les `asyncio.to_thread`).
- Timeouts explicites (30-60 s), gestion d'erreur propre.

**DoD :**
- [ ] Plus aucun import `urllib` dans services/
- [ ] Les fallbacks (Gemini → Ollama → local) fonctionnent toujours (tester en coupant le réseau)

### Étape 1.3 — Schémas Pydantic en response_model
- Brancher les schémas existants (et en créer pour chaque endpoint) comme `response_model` dans `certification.py`.
- Valider la structure retournée par `_parse_soutenance_json` (comme le fait déjà `_parse_evaluation`) avec valeurs par défaut.

**DoD :**
- [ ] `/docs` (Swagger) affiche des schémas de réponse complets pour tous les endpoints
- [ ] Une réponse LLM malformée ne provoque plus de 500 (testé avec un mock)

### Étape 1.4 — Sécuriser les endpoints
- `/upload` : limite de taille (ex. 20 Mo), whitelist d'extensions (.pdf, .docx, .md, .txt), erreur 413/415 sinon.
- `/tts` : limite de longueur du texte (ex. 500 caractères).
- Rate limiting simple (slowapi) sur `/oral-evaluate`, `/soutenance-evaluate`, `/tts`.

**DoD :**
- [ ] Upload d'un .exe → 415 ; fichier 50 Mo → 413
- [ ] 20 appels/min sur `/tts` → 429

---

## PHASE 2 — Analyse réelle du dossier de projet (2-3 jours)

### Étape 2.1 — Extraction de texte
- `pip install pypdf python-docx`
- Créer `backend/app/services/document_parser.py` : `extract_text(filename, contents) -> str` gérant PDF (pypdf), DOCX (python-docx), MD/TXT (décodage direct).

**DoD :**
- [ ] Un vrai PDF de dossier retourne son texte intégral (vérifié manuellement)
- [ ] Tests unitaires : 1 PDF, 1 DOCX, 1 TXT d'exemple dans `tests/fixtures/`

### Étape 2.2 — Grille conforme au sommaire officiel du dossier de projet
Remplacer les 4 critères actuels par la checklist du RC :
1. Liste des compétences mises en œuvre
2. Cahier des charges / expression des besoins
3. Gestion de projet (méthode, planning)
4. Maquettes et enchaînement des maquettes
5. Captures d'écran des interfaces + extraits de code front significatifs
6. MCD/MLD + script BDD + extraits de code back significatifs
7. Éléments de sécurité (OWASP, mesures appliquées)
8. Jeu d'essai (données, résultats attendus/obtenus)
9. Veille technologique
10. **Résumé en anglais** (obligatoire — détecter une section majoritairement anglophone)

Score = pondération de ces 10 critères (plus de base 60 arbitraire).

**DoD :**
- [ ] Chaque critère détecté sur un dossier réel complet ; non détecté sur un dossier vide
- [ ] Le résumé anglais est repéré (test avec/sans)
- [ ] Le feedback de chaque critère cite ce qui est attendu par le référentiel

### Étape 2.3 — Questions personnalisées basées sur le vrai contenu
Passer le texte extrait (tronqué ~6000 caractères) au générateur de questions au lieu du prompt générique actuel.

**DoD :**
- [ ] Les questions générées mentionnent des éléments réels du dossier uploadé

---

## PHASE 3 — Conformité au déroulé officiel de l'épreuve (3-5 jours)

Objectif : simuler l'épreuve complète de **2 h 00** : 35 + 40 + 30 + 15 min.

### Étape 3.1 — Écran "Déroulé de l'épreuve"
- Page d'accueil du simulateur présentant les 4 épreuves, leurs durées et leur ordre, avec un mode "Examen blanc complet" enchaînant les 4.

**DoD :**
- [ ] Les 4 épreuves et durées officielles sont affichées et exactes

### Étape 3.2 — Entretien technique 40 min
- Réutiliser le mode "examinateur interactif" mais : timer 40 min, questions issues de la soutenance (custom_jury_questions) + banque, fin automatique au timer.

**DoD :**
- [ ] Timer 40 min visible, l'entretien se clôt à 0 avec bilan
- [ ] Les questions issues de la soutenance sont prioritaires

### Étape 3.3 — Questionnaire professionnel conforme (30 min)
C'est le gros écart actuel. Format officiel :
- Le candidat étudie une **documentation technique en anglais**
- 2 questions fermées à choix unique posées **en français**
- 2 questions ouvertes posées **en anglais**, réponse rédigée **en anglais**

Implémentation :
- Nouveau service `questionnaire_generator.py` : le LLM génère un extrait de doc technique EN (~300 mots, lié à la stack du candidat) + les 4 questions.
- Nouvel onglet frontend : affichage doc, timer 30 min, 2 QCU + 2 champs texte libres, correction LLM des réponses anglaises (pertinence + qualité de l'anglais).
- Fallback statique : 2-3 questionnaires pré-rédigés en dur si LLM indisponible.

**DoD :**
- [ ] Le format 2 QCU FR + 2 ouvertes EN est respecté
- [ ] Les réponses EN reçoivent un feedback (contenu + langue)
- [ ] Fonctionne sans LLM (fallback)

### Étape 3.4 — Entretien final 15 min
- Mode chat de 5-6 questions non techniques : compréhension du métier, posture professionnelle, parcours, retour sur le Dossier Professionnel (DP), motivation.
- Banque de questions statique + évaluation LLM du savoir-être/clarté.

**DoD :**
- [ ] Timer 15 min, questions orientées métier (aucune question de code)
- [ ] Bilan final distinct

### Étape 3.5 — Bilan global d'examen blanc
- À la fin du parcours complet : synthèse des 4 épreuves, points forts/faibles par compétence AT1/AT2, verdict indicatif (admis / entretien complémentaire recommandé).
- Sauvegarde en BDD (étendre `ExamSession` avec `exam_part`).

**DoD :**
- [ ] Un examen blanc complet de bout en bout produit un rapport unique sauvegardé et consultable dans l'historique

---

## PHASE 4 — Démontrer les compétences DWWM dans le projet lui-même (3-5 jours)

Ces ajouts servent le dossier de l'élève : chaque item = une compétence du référentiel à défendre devant le jury.

### Étape 4.1 — Authentification (compétence sécurité back-end)
- Table `users` (email, password_hash), inscription/connexion.
- Hachage **bcrypt** (passlib), tokens **JWT** (python-jose), dépendance `get_current_user` protégeant les endpoints de sessions.
- Front : pages login/register, stockage token en mémoire, header Authorization.

**DoD :**
- [ ] Mot de passe stocké haché uniquement (vérifié en BDD)
- [ ] `/sessions` sans token → 401 ; avec token → 200 et uniquement SES sessions
- [ ] Token expiré → 401

### Étape 4.2 — Enrichir le modèle de données (compétence BDD)
- Lier `exam_sessions` à `users` (FK).
- Ajouter une relation **N:N** justifiable : ex. table `badges` (compétences validées) ↔ `users` via table d'association.
- Produire le **MCD/MLD** (draw.io / dbdiagram.io) et l'exporter dans `docs/`.

**DoD :**
- [ ] MCD et MLD dans `docs/`, cohérents avec le schéma réel
- [ ] Relation N:N fonctionnelle avec contrainte d'intégrité

### Étape 4.3 — Tests (compétence tests/jeu d'essai)
- Backend : `pytest` + `httpx` — tester `document_parser`, `_parse_evaluation`, les endpoints (upload, auth, sessions) avec BDD SQLite en mémoire. Objectif ≥ 60 % de couverture services/routes.
- Frontend : `vitest` + Testing Library — 3-4 tests sur les composants clés.
- Documenter un **jeu d'essai** dans `docs/jeu_essai.md` (cas, données, attendu, obtenu).

**DoD :**
- [ ] `pytest` vert, couverture affichée
- [ ] `npm run test` vert
- [ ] `docs/jeu_essai.md` complété

### Étape 4.4 — Docker + CI (compétence DevOps/déploiement)
- `Dockerfile` backend, `Dockerfile` frontend (build + nginx), `docker-compose.yml`.
- GitHub Actions : workflow lint + tests back et front sur chaque push/PR.
- `docs/deploiement.md` : procédure de déploiement.

**DoD :**
- [ ] `docker compose up` lance l'app complète en local
- [ ] Le badge CI est vert sur la branche main
- [ ] Push d'un test cassé → CI rouge

---

## PHASE 5 — Refactoring frontend (2-3 jours)

### Étape 5.1 — Découper CertificationSimulator.tsx (1270 lignes)
Structure cible :
```
src/
  pages/CertificationSimulator.tsx   (orchestration ~150 lignes)
  components/exam/
    OralTab.tsx  QcmTab.tsx  InteractiveExaminer.tsx
    SoutenanceModal.tsx  DossierChecker.tsx  KanbanBoard.tsx
    QuestionnairePro.tsx  EntretienFinal.tsx
  hooks/
    useExamTimer.ts  useSoutenance.ts  useInteractiveExam.ts
  services/api.ts   (tous les fetch centralisés)
```

**DoD :**
- [ ] Aucun fichier > 300 lignes
- [ ] Aucun `fetch` en dehors de `services/api.ts`
- [ ] Comportement identique (test manuel de chaque onglet)

### Étape 5.2 — Supprimer les comportements trompeurs
- Échec d'upload → message d'erreur clair (plus de score `Math.random()`).
- Supprimer l'endpoint `/transcribe` factice (ou l'implémenter avec faster-whisper — optionnel).
- Si Web Speech API non supportée (`hasSupport` false) → bandeau d'info + saisie clavier.

**DoD :**
- [ ] Backend coupé → l'UI affiche une erreur, jamais un faux score
- [ ] Plus aucune donnée simulée présentée comme réelle

---

## PHASE 6 — Finitions (1-2 jours)

- [ ] Accessibilité : labels sur tous les inputs, navigation clavier, contrastes ≥ 4.5:1, audit Lighthouse ≥ 90 (cohérence avec les questions RGAA posées par l'app !)
- [ ] Historique de progression : graphique de scores par domaine sur les sessions passées
- [ ] Export PDF du bilan d'examen blanc
- [ ] Relecture finale : `README`, `docs/`, screenshots pour le dossier de projet

---

## Ordre et estimation

| Phase | Contenu | Durée estimée |
|---|---|---|
| 0 | Sécurité + hygiène repo | 0,5 j |
| 1 | Fondations backend | 2-3 j |
| 2 | Analyse réelle du dossier | 2-3 j |
| 3 | Conformité épreuve 2 h | 3-5 j |
| 4 | Compétences DWWM (auth, BDD, tests, Docker) | 3-5 j |
| 5 | Refactoring frontend | 2-3 j |
| 6 | Finitions | 1-2 j |
| **Total** | | **~14-21 jours** |

Workflow imposé au junior : branche `feat/x.y-nom` → commits atomiques → PR avec la DoD cochée dans la description → revue → merge. Pas de commit direct sur `main`.
