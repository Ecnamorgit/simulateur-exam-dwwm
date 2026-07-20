# Intelligence artificielle : providers, repli et configuration

Ce document explique **comment fonctionne l'IA** dans le simulateur, quelles options
existent, et comment les configurer.

## 1. Le principe : 3 niveaux de repli automatique

Chaque évaluation par IA suit une **chaîne de repli**. Si un niveau échoue, le suivant prend
le relais — l'application ne tombe jamais en panne :

1. **Google Gemini** (cloud) — utilisé si une clé API valide est configurée.
2. **Ollama** (IA locale) — utilisé si Gemini est absent/échoue **et** qu'Ollama tourne sur la machine.
3. **Repli local statique** — barèmes heuristiques + banques de questions/questionnaires pré-rédigés. **Toujours disponible**, sans internet ni clé.

Détail par fonctionnalité :

| Fonctionnalité | Gemini | Ollama | Repli statique |
|---|:---:|:---:|:---:|
| Évaluation de la soutenance | ✅ | ✅ | ✅ (barème + questions génériques) |
| Entretien technique (oral) | ✅ | ✅ | ✅ (analyse par mots-clés) |
| Questionnaire professionnel | ✅ | ✅ | ✅ (questionnaires pré-rédigés) |
| Questions générées depuis le dossier | ✅ | ✅ | ✅ (banque de questions locale) |
| Entretien final | ✅ | — | ✅ (heuristique) |

## 2. « Est-ce que ça marche avec Gemini seul ? »

**Oui.** Avec une clé Gemini valide, **toutes** les fonctions IA fonctionnent, sans avoir
besoin d'Ollama. Ollama est une **alternative locale optionnelle** (utile hors-ligne, ou si
vous ne souhaitez pas utiliser de service cloud).

De même, **sans aucune IA** (ni Gemini ni Ollama), l'application reste **entièrement
utilisable** grâce au repli statique — les évaluations sont alors plus basiques (heuristiques).

## 3. « Le free tier Gemini suffit-il pour un examen blanc complet ? »

**Oui, pour un usage d'entraînement individuel.** Un examen blanc complet génère environ
**20 appels** à Gemini, répartis sur **2 heures** :

| Épreuve | Appels Gemini (approx.) |
|---|---|
| Soutenance | 1 |
| Entretien technique (jusqu'à 10 échanges) | ≤ 10 |
| Questionnaire (1 génération + 2 corrections) | 3 |
| Entretien final (6 questions) | 6 |

C'est très en dessous des quotas journaliers du free tier.

⚠️ **Seule limite à connaître** : la limite **par minute** (RPM). Si beaucoup d'appels
partent en quelques secondes, Gemini renvoie `429 Too Many Requests`. Dans l'usage réel ce
n'est pas gênant : vous parlez / rédigez vos réponses, donc les appels sont naturellement
espacés. Et si un `429` survient, l'application **bascule automatiquement sur le repli** le
temps que le quota se réinitialise (≈ 1 minute).

> Vos limites exactes (elles dépendent du compte) sont affichées sur le **dashboard AI Studio** :
> https://aistudio.google.com/rate-limit

**Conclusion : le free tier est suffisant pour passer un examen blanc complet en conditions réelles.**

## 4. La synthèse vocale (voix du jury) — pourquoi parfois « robotique » ?

La voix **n'utilise ni Gemini ni la clé API**. Elle a sa propre chaîne :

1. **edge-tts** (par défaut) — voix **neuronale** de Microsoft (`fr-FR-HenriNeural`), naturelle.
   **Aucune clé requise**, mais **nécessite une connexion internet** (le backend contacte le service Edge).
2. **Repli navigateur** — si edge-tts est injoignable, l'application utilise la **synthèse vocale
   native du navigateur** (Web Speech API). C'est cette voix qui sonne « robotique ».

Autrement dit : la voix robotique n'apparaît **que** si edge-tts est indisponible (hors-ligne,
réseau bloqué). En temps normal, la voix est naturelle et gratuite.

## 5. Configurer l'IA locale avec Ollama (optionnel)

Ollama permet de faire tourner l'IA **en local**, sans cloud ni clé (utile hors-ligne, ou par
choix de confidentialité).

1. **Installer Ollama** : https://ollama.com/download (Windows / macOS / Linux).
2. **Télécharger le modèle** utilisé par l'application :

   ```bash
   ollama pull qwen2.5-coder:14b
   ```

   > Ce modèle pèse ~9 Go et demande une machine correcte (idéalement 16 Go de RAM, un GPU aide).
   > Sur une machine modeste, utilisez un modèle plus léger, par ex. `qwen2.5-coder:7b` ou
   > `llama3.1:8b` — il faut alors changer le nom du modèle dans le code (voir ci-dessous).

3. **Lancer Ollama** : il tourne en service sur `http://localhost:11434`. Vérifiez avec :

   ```bash
   ollama list
   ```

4. **C'est tout** : l'application détecte Ollama automatiquement (aucune configuration). Si
   Gemini est absent ou échoue, elle utilise Ollama.

### Changer le modèle Ollama

Le nom du modèle est défini dans les services backend (constante `_OLLAMA_MODEL`) :

- `backend/app/services/oral_evaluator.py`
- `backend/app/services/question_generator.py`
- `backend/app/services/questionnaire_generator.py`

Remplacez `qwen2.5-coder:14b` par le modèle téléchargé (ex. `qwen2.5-coder:7b`).

## 6. Résumé des configurations possibles

| Configuration | Ce qu'il faut | Qualité des évaluations |
|---|---|---|
| **Gemini (recommandé)** | Une clé dans `backend/.env` | Excellente, aucune installation locale |
| **Ollama (local)** | Ollama installé + un modèle | Bonne, hors-ligne, privée, mais gourmande |
| **Aucune IA** | Rien | Basique (heuristiques), mais fonctionnel |

La **voix** (edge-tts) fonctionne dans tous les cas tant qu'il y a internet, sans clé.
