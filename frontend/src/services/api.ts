/**
 * Point d'accès unique à l'API backend.
 * Tous les appels réseau (fetch) de l'application transitent par ce module.
 */

const BASE = '/api/certification';

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
