"""
Questionnaire professionnel (épreuve de 30 min du DWWM).

Format officiel simulé :
  - Le candidat étudie une documentation technique rédigée EN ANGLAIS (~300 mots) ;
  - 2 questions fermées à choix unique (QCU) posées EN FRANÇAIS ;
  - 2 questions ouvertes posées EN ANGLAIS, réponse rédigée en anglais.

Fournit :
  - generate_questionnaire(stack)         -> doc EN + 2 QCU FR + 2 ouvertes EN
  - evaluate_open_answer(question, answer) -> feedback contenu + qualité de l'anglais

Chaîne de providers : Gemini -> Ollama -> fallback statique (toujours dispo).
"""

import json

import httpx

from app.core.config import settings

_GEMINI_TIMEOUT = httpx.Timeout(45.0, connect=10.0)
_OLLAMA_TIMEOUT = httpx.Timeout(60.0, connect=10.0)
_OLLAMA_URL = "http://localhost:11434/api/chat"
_OLLAMA_MODEL = "qwen2.5-coder:14b"


# ---------------------------------------------------------------------------
# Fallback statique : questionnaires pré-rédigés (fonctionne sans LLM)
# ---------------------------------------------------------------------------
STATIC_QUESTIONNAIRES: list[dict] = [
    {
        "documentation": (
            "REST APIs and HTTP status codes\n\n"
            "A REST API exposes resources through URLs and standard HTTP methods. "
            "The GET method retrieves a resource, POST creates a new one, PUT replaces "
            "an existing resource, and DELETE removes it. Every response includes a status "
            "code that tells the client what happened. Codes in the 2xx range mean success: "
            "200 OK for a standard response, 201 Created when a new resource has been created. "
            "The 4xx range indicates a client error: 400 Bad Request when the payload is "
            "invalid, 401 Unauthorized when authentication is missing, 403 Forbidden when the "
            "user is authenticated but not allowed, and 404 Not Found when the resource does "
            "not exist. The 5xx range means the server failed to handle a valid request, such "
            "as 500 Internal Server Error. A well-designed API is consistent, stateless, and "
            "returns meaningful status codes so that clients can react correctly to each "
            "situation. Proper error handling and clear documentation are essential for other "
            "developers who consume the API."
        ),
        "closed_questions": [
            {
                "question": "D'après la documentation, quel code HTTP doit être renvoyé après la création réussie d'une ressource ?",
                "choices": ["200 OK", "201 Created", "204 No Content", "404 Not Found"],
                "correct_answer": "201 Created",
            },
            {
                "question": "Selon le texte, que signifie une réponse dont le code est dans la plage 4xx ?",
                "choices": [
                    "Une erreur côté serveur",
                    "Une redirection",
                    "Une erreur côté client",
                    "Un succès",
                ],
                "correct_answer": "Une erreur côté client",
            },
        ],
        "open_questions": [
            {"question": "In your own words, explain the difference between the PUT and POST methods."},
            {"question": "Why is it important for a REST API to return meaningful HTTP status codes?"},
        ],
    },
    {
        "documentation": (
            "Password storage and hashing\n\n"
            "Storing passwords in plain text is one of the most dangerous mistakes a developer "
            "can make. If the database is ever leaked, every account is immediately compromised. "
            "Instead, passwords must be hashed before being stored. A hash function transforms "
            "the password into a fixed-length string that cannot be reversed. However, a simple "
            "hash is not enough, because attackers use precomputed tables to crack common "
            "passwords. To defend against this, each password is combined with a random value "
            "called a salt before hashing, so that identical passwords produce different hashes. "
            "Modern algorithms such as bcrypt or argon2 are deliberately slow and include a cost "
            "factor, which makes brute-force attacks far more expensive. When a user logs in, the "
            "server hashes the submitted password with the same salt and compares the result with "
            "the stored hash. The plain password is never stored and never compared directly. "
            "This approach protects users even if the database is exposed."
        ),
        "closed_questions": [
            {
                "question": "D'après la documentation, à quoi sert le « sel » (salt) ajouté au mot de passe ?",
                "choices": [
                    "À chiffrer le mot de passe de façon réversible",
                    "À ce que deux mots de passe identiques produisent des hachages différents",
                    "À accélérer le calcul du hachage",
                    "À stocker le mot de passe en clair",
                ],
                "correct_answer": "À ce que deux mots de passe identiques produisent des hachages différents",
            },
            {
                "question": "Selon le texte, pourquoi utilise-t-on des algorithmes comme bcrypt ou argon2 ?",
                "choices": [
                    "Parce qu'ils sont réversibles",
                    "Parce qu'ils sont volontairement lents (facteur de coût)",
                    "Parce qu'ils stockent le mot de passe en clair",
                    "Parce qu'ils suppriment le besoin de sel",
                ],
                "correct_answer": "Parce qu'ils sont volontairement lents (facteur de coût)",
            },
        ],
        "open_questions": [
            {"question": "Explain in English why storing passwords in plain text is dangerous."},
            {"question": "Describe what happens, step by step, when a user logs in with a correct password."},
        ],
    },
]


def _build_generation_prompt(stack: str) -> str:
    stack_hint = f" The candidate's stack is: {stack}." if stack else ""
    return (
        "You create a professional questionnaire for the French DWWM certification. "
        "Return ONLY valid JSON with this exact structure:\n"
        '{"documentation": "<a technical documentation text written IN ENGLISH, ~300 words>", '
        '"closed_questions": [{"question": "<question EN FRANCAIS>", "choices": ["a","b","c","d"], "correct_answer": "<exact choice>"}, {...}], '
        '"open_questions": [{"question": "<open question IN ENGLISH>"}, {"question": "<open question IN ENGLISH>"}]}\n'
        "Exactly 2 closed_questions (single choice, asked in FRENCH, about the English doc) "
        "and exactly 2 open_questions (asked in ENGLISH, to be answered in English)."
        f"{stack_hint} Return only the JSON."
    )


def _parse_questionnaire(content: str) -> dict:
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.split("```")[1].split("```")[0].strip()
    start = content.find("{")
    end = content.rfind("}")
    if start != -1 and end != -1:
        content = content[start:end + 1]
    return _normalize_questionnaire(json.loads(content))


def _normalize_questionnaire(parsed: dict) -> dict:
    """Garantit la structure attendue (2 QCU, 2 ouvertes) sinon lève ValueError."""
    if not isinstance(parsed, dict):
        raise ValueError("questionnaire is not an object")

    doc = str(parsed.get("documentation", "")).strip()
    if not doc:
        raise ValueError("missing documentation")

    closed = []
    for q in parsed.get("closed_questions") or []:
        if isinstance(q, dict) and q.get("question") and isinstance(q.get("choices"), list):
            closed.append({
                "question": str(q["question"]),
                "choices": [str(c) for c in q["choices"]],
                "correct_answer": str(q.get("correct_answer", "")),
            })
    open_q = []
    for q in parsed.get("open_questions") or []:
        if isinstance(q, dict) and q.get("question"):
            open_q.append({"question": str(q["question"])})

    if len(closed) < 2 or len(open_q) < 2:
        raise ValueError("questionnaire must have 2 closed and 2 open questions")

    return {
        "documentation": doc,
        "closed_questions": closed[:2],
        "open_questions": open_q[:2],
    }


async def _call_gemini_questionnaire(stack: str) -> dict:
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent"
    data = {
        "contents": [{"parts": [{"text": _build_generation_prompt(stack)}]}],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 2048},
    }
    async with httpx.AsyncClient(timeout=_GEMINI_TIMEOUT) as client:
        r = await client.post(url, json=data, headers={"Content-Type": "application/json", "x-goog-api-key": api_key})
        r.raise_for_status()
        res = r.json()
    content = res["candidates"][0]["content"]["parts"][0]["text"].strip()
    return _parse_questionnaire(content)


async def _call_ollama_questionnaire(stack: str) -> dict:
    data = {
        "model": _OLLAMA_MODEL,
        "messages": [{"role": "user", "content": _build_generation_prompt(stack)}],
        "stream": False,
    }
    async with httpx.AsyncClient(timeout=_OLLAMA_TIMEOUT) as client:
        r = await client.post(_OLLAMA_URL, json=data)
        r.raise_for_status()
        res = r.json()
    content = res["message"]["content"].strip()
    return _parse_questionnaire(content)


async def generate_questionnaire(stack: str = "", provider: str = "auto") -> dict:
    """Génère un questionnaire professionnel (doc EN + 2 QCU FR + 2 ouvertes EN)."""
    if provider in ("gemini", "auto"):
        try:
            return await _call_gemini_questionnaire(stack)
        except Exception as e:
            print(f"[questionnaire] Gemini failed: {e}")
    if provider in ("ollama", "auto"):
        try:
            return await _call_ollama_questionnaire(stack)
        except Exception as e:
            print(f"[questionnaire] Ollama failed: {e}")

    # Fallback statique : on alterne selon la stack pour un peu de variété.
    idx = 1 if stack and any(k in stack.lower() for k in ("auth", "secur", "login", "jwt", "bcrypt")) else 0
    return dict(STATIC_QUESTIONNAIRES[idx])


# ---------------------------------------------------------------------------
# Évaluation des réponses ouvertes (contenu + qualité de l'anglais)
# ---------------------------------------------------------------------------

def grade_closed_answers(closed_questions: list[dict], answers: list[str]) -> dict:
    """Corrige automatiquement les QCU (comparaison à la bonne réponse)."""
    correct = 0
    details = []
    for i, q in enumerate(closed_questions):
        given = answers[i] if i < len(answers) else ""
        is_correct = given.strip() == str(q.get("correct_answer", "")).strip()
        if is_correct:
            correct += 1
        details.append({
            "question": q.get("question", ""),
            "given": given,
            "correct_answer": q.get("correct_answer", ""),
            "is_correct": is_correct,
        })
    return {"correct": correct, "total": len(closed_questions), "details": details}


def _fallback_open_eval(question: str, answer: str) -> dict:
    words = answer.split()
    wc = len(words)
    # Heuristique simple de qualité de l'anglais / de contenu.
    relevance = min(10, 3 + wc // 12) if wc else 0
    english = min(10, 3 + wc // 15) if wc else 0
    if wc < 8:
        feedback = "Réponse trop courte : développez davantage, en anglais, en vous appuyant sur la documentation."
    else:
        feedback = ("Réponse enregistrée (évaluation hors-ligne). Veillez à structurer votre anglais "
                    "en phrases complètes et à répondre précisément à la question.")
    return {"relevance_score": relevance, "english_score": english, "feedback": feedback}


async def _call_gemini_open_eval(question: str, answer: str, documentation: str) -> dict:
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent"
    prompt = (
        "You are a DWWM examiner grading an open answer written in English about a technical "
        "documentation. Evaluate BOTH the relevance of the content and the quality of the English. "
        "Return ONLY valid JSON: "
        '{"relevance_score": <int 0-10>, "english_score": <int 0-10>, "feedback": "<feedback en francais, 2-3 phrases>"}\n\n'
        f"Documentation:\n{documentation[:2000]}\n\nQuestion: {question}\n\nCandidate answer: {answer}"
    )
    data = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"temperature": 0.4, "maxOutputTokens": 512}}
    async with httpx.AsyncClient(timeout=_GEMINI_TIMEOUT) as client:
        r = await client.post(url, json=data, headers={"Content-Type": "application/json", "x-goog-api-key": api_key})
        r.raise_for_status()
        res = r.json()
    content = res["candidates"][0]["content"]["parts"][0]["text"].strip()
    return _parse_open_eval(content)


def _parse_open_eval(content: str) -> dict:
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0].strip()
    elif "```" in content:
        content = content.split("```")[1].split("```")[0].strip()
    start = content.find("{")
    end = content.rfind("}")
    if start != -1 and end != -1:
        content = content[start:end + 1]
    parsed = json.loads(content)

    def _score(v):
        try:
            return max(0, min(10, int(v)))
        except (TypeError, ValueError):
            return 5

    return {
        "relevance_score": _score(parsed.get("relevance_score")),
        "english_score": _score(parsed.get("english_score")),
        "feedback": str(parsed.get("feedback", "Réponse évaluée.")),
    }


async def evaluate_open_answer(question: str, answer: str, documentation: str = "", provider: str = "auto") -> dict:
    """Évalue une réponse ouverte en anglais (pertinence + qualité de l'anglais)."""
    if not answer or not answer.strip():
        return {"relevance_score": 0, "english_score": 0, "feedback": "Aucune réponse fournie."}

    if provider in ("gemini", "auto"):
        try:
            return await _call_gemini_open_eval(question, answer, documentation)
        except Exception as e:
            print(f"[questionnaire] Gemini open-eval failed: {e}")

    return _fallback_open_eval(question, answer)
