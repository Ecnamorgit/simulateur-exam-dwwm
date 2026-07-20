import { useState } from 'react';
import { ExamPartId, EXAM_PARTS } from '../data/examParts';

export type ExamBlancResults = Partial<Record<ExamPartId, number>>;

/** Ordre officiel des épreuves pour l'examen blanc complet. */
export const EXAM_ORDER: ExamPartId[] = EXAM_PARTS.map((p) => p.id);

export function nextExamPart(id: ExamPartId): ExamPartId | null {
  const i = EXAM_ORDER.indexOf(id);
  return i >= 0 && i < EXAM_ORDER.length - 1 ? EXAM_ORDER[i + 1] : null;
}

/** Suit la progression d'un examen blanc complet (les 4 épreuves enchaînées). */
export function useExamBlanc() {
  const [active, setActive] = useState(false);
  const [results, setResults] = useState<ExamBlancResults>({});

  const start = () => { setActive(true); setResults({}); };
  const record = (id: ExamPartId, score: number) => setResults((prev) => ({ ...prev, [id]: score }));
  const cancel = () => { setActive(false); setResults({}); };

  return { active, results, start, record, cancel };
}
