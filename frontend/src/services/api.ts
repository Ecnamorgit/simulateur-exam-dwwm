/**
 * Point d'accès unique à l'API backend.
 * Tous les appels réseau (fetch) de l'application transitent par ce module.
 */

const BASE = '/api/certification';
const AUTH_BASE = '/api/auth';

// Jeton JWT conservé EN MÉMOIRE uniquement (jamais en localStorage).
let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return authToken ? { ...extra, Authorization: `Bearer ${authToken}` } : extra;
}

/** Inscription d'un nouvel utilisateur. */
export async function register(email: string, password: string): Promise<any> {
  const res = await fetch(`${AUTH_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const detail = res.status === 409 ? 'Un compte existe déjà avec cet email.'
      : res.status === 422 ? 'Mot de passe trop court (8 caractères minimum).'
      : "Échec de l'inscription.";
    throw new Error(detail);
  }
  return res.json();
}

/** Connexion : retourne le token JWT. */
export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${AUTH_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Email ou mot de passe incorrect.');
  return (await res.json()).access_token;
}

export interface OralEvalPayload {
  question: string;
  user_answer: string;
  context?: { question: string; answer: string }[];
}

export interface SoutenanceEvalPayload {
  transcript: string;
  dossier_text?: string;
  duration_seconds?: number;
}

/** Envoie le dossier de projet et retourne l'analyse + les questions générées. */
export async function uploadDossier(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${BASE}/upload`, { method: 'POST', body: formData });
  if (!response.ok) {
    throw new Error('Erreur lors du traitement du fichier par le backend.');
  }
  return response.json();
}

/** Évalue une réponse orale du candidat. */
export async function evaluateOral(payload: OralEvalPayload): Promise<any> {
  const res = await fetch(`${BASE}/oral-evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

/** Évalue la soutenance complète (35 min) et retourne le bilan + questions jury. */
export async function evaluateSoutenance(payload: SoutenanceEvalPayload): Promise<any> {
  const res = await fetch(`${BASE}/soutenance-evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

/** Enregistre une session d'examen (ex. bilan d'examen blanc) en base. */
export async function createSession(payload: {
  duration_seconds: number;
  score: number;
  transcript: string;
  status: string;
  exam_part?: string;
}): Promise<any> {
  const res = await fetch(`${BASE}/sessions`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Impossible d'enregistrer la session.");
  return res.json();
}

/** Récupère l'historique des sessions de l'utilisateur connecté. */
export async function getSessions(): Promise<any[]> {
  const res = await fetch(`${BASE}/sessions`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Impossible de charger l'historique.");
  return res.json();
}

/** Récupère les badges de compétences obtenus par l'utilisateur connecté. */
export async function getMyBadges(): Promise<any[]> {
  const res = await fetch(`/api/badges/me`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Impossible de charger les badges.');
  return res.json();
}

/** URL de synthèse vocale (TTS) pour un texte donné. */
export function ttsUrl(text: string): string {
  return `${BASE}/tts?text=${encodeURIComponent(text)}`;
}

/** Récupère un questionnaire professionnel (doc EN + 2 QCU FR + 2 ouvertes EN). */
export async function getQuestionnaire(stack: string = ''): Promise<any> {
  const res = await fetch(`${BASE}/questionnaire?stack=${encodeURIComponent(stack)}`);
  if (!res.ok) throw new Error('Impossible de charger le questionnaire.');
  return res.json();
}

/** Corrige les QCU et évalue les réponses ouvertes anglaises. */
export async function evaluateQuestionnaire(payload: any): Promise<any> {
  const res = await fetch(`${BASE}/questionnaire-evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

/** Banque de questions de l'entretien final (non technique). */
export async function getFinalQuestions(): Promise<string[]> {
  const res = await fetch(`${BASE}/entretien-final-questions`);
  if (!res.ok) throw new Error("Impossible de charger les questions de l'entretien final.");
  return (await res.json()).questions;
}

/** Évalue une réponse de l'entretien final (savoir-être / clarté). */
export async function evaluateFinalAnswer(question: string, answer: string): Promise<any> {
  const res = await fetch(`${BASE}/entretien-final-evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, answer }),
  });
  return res.json();
}
