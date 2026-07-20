# Jeu d'essai

Ce document présente le jeu d'essai du Simulateur DWWM : pour chaque cas, les données
en entrée, le résultat **attendu** et le résultat **obtenu** (validé par les tests
automatisés `backend/tests/` et `frontend/src/**/*.test.*`).

## 1. Extraction de dossier (`document_parser`)

| # | Données en entrée | Résultat attendu | Résultat obtenu |
|---|---|---|---|
| 1 | PDF `sample.pdf` contenant « Marqueur: PDFOK » | Le texte extrait contient `PDFOK` | ✅ conforme |
| 2 | DOCX `sample.docx` avec paragraphes + tableau | Texte des paragraphes ET des tableaux extrait | ✅ conforme |
| 3 | TXT `sample.txt` | Décodage UTF-8 direct | ✅ conforme |
| 4 | Fichier `.pdf` corrompu (non-PDF) | Chaîne vide, aucune exception | ✅ conforme |

## 2. Analyse de conformité du dossier (`dossier_checker`)

| # | Données en entrée | Résultat attendu | Résultat obtenu |
|---|---|---|---|
| 5 | Dossier complet (10 rubriques + résumé anglais) | Score 100/100, 10 critères détectés | ✅ conforme |
| 6 | Dossier vide | Score 0/100, aucun critère détecté | ✅ conforme |
| 7 | Texte français uniquement | Résumé anglais **non** détecté | ✅ conforme |
| 8 | Paragraphe anglais (sans intitulé) | Résumé anglais détecté (analyse linguistique) | ✅ conforme |

## 3. Évaluation orale (`oral_evaluator`)

| # | Données en entrée | Résultat attendu | Résultat obtenu |
|---|---|---|---|
| 9 | JSON LLM valide `{"score": 8, ...}` | `score = 8`, structure normalisée | ✅ conforme |
| 10 | JSON avec `score = 42` | Score borné à 10 | ✅ conforme |
| 11 | JSON malformé / score non numérique | Valeurs par défaut, aucune 500 | ✅ conforme |
| 12 | Soutenance : réponse LLM incomplète | 5 phases + 3 questions garanties (défauts) | ✅ conforme |

## 4. Questionnaire professionnel (`questionnaire_generator`)

| # | Données en entrée | Résultat attendu | Résultat obtenu |
|---|---|---|---|
| 13 | Génération (fallback statique) | 1 doc EN + 2 QCU FR + 2 ouvertes EN | ✅ conforme |
| 14 | 2 QCU, 1 bonne + 1 mauvaise réponse | `correct = 1 / 2` | ✅ conforme |
| 15 | Réponse ouverte non vide | Feedback + scores pertinence/anglais 0-10 | ✅ conforme |

## 5. Authentification (`auth`)

| # | Données en entrée | Résultat attendu | Résultat obtenu |
|---|---|---|---|
| 16 | Inscription email + mot de passe ≥ 8 car. | 201, réponse **sans** le mot de passe | ✅ conforme |
| 17 | Mot de passe < 8 caractères | 422 (validation) | ✅ conforme |
| 18 | Email déjà utilisé | 409 (conflit) | ✅ conforme |
| 19 | Connexion mot de passe erroné | 401 | ✅ conforme |
| 20 | `GET /sessions` sans jeton | 401 | ✅ conforme |
| 21 | `GET /sessions` avec jeton valide | 200, **uniquement** les sessions de l'utilisateur | ✅ conforme |
| 22 | Jeton expiré | 401 | ✅ conforme |
| 23 | Mot de passe stocké en base | Haché bcrypt (`$2...`), jamais en clair | ✅ conforme |

## 6. Badges — relation N:N (`badges`)

| # | Données en entrée | Résultat attendu | Résultat obtenu |
|---|---|---|---|
| 24 | `GET /badges` | Les 4 badges de référence présents | ✅ conforme |
| 25 | Attribution du même badge deux fois | Un seul badge (intégrité, clé composite) | ✅ conforme |
| 26 | Examen blanc enregistré avec score ≥ 70 | Badge `examen-blanc` attribué automatiquement | ✅ conforme |
| 27 | Examen blanc avec score < 70 | Aucun badge attribué | ✅ conforme |

## 7. Frontend (composants clés)

| # | Cas | Résultat attendu | Résultat obtenu |
|---|---|---|---|
| 28 | `formatTime(65)` | `"01:05"` | ✅ conforme |
| 29 | `EXAM_PARTS` | 4 épreuves, durées 35/40/30/15, total 120 min | ✅ conforme |
| 30 | `TabNav` clic sur un onglet | `onSelect` appelé avec l'id | ✅ conforme |
| 31 | `CategoryFilterBar` | Catégories + compteur par catégorie affichés | ✅ conforme |

---

## Reproduction

```bash
# Backend (57 tests, couverture ≥ 60 %)
cd backend
../venv/Scripts/python.exe -m pytest -q --cov=app --cov-report=term

# Frontend (8 tests)
cd frontend
npm run test
```
