import { describe, it, expect } from 'vitest';
import { EXAM_PARTS, TOTAL_EXAM_MINUTES } from './examParts';

describe('examParts', () => {
  it('définit les 4 épreuves officielles', () => {
    expect(EXAM_PARTS).toHaveLength(4);
    expect(EXAM_PARTS.map((p) => p.durationMin)).toEqual([35, 40, 30, 15]);
  });

  it('totalise 2 h (120 minutes)', () => {
    expect(TOTAL_EXAM_MINUTES).toBe(120);
  });

  it('numérote les épreuves de 1 à 4 dans l’ordre', () => {
    expect(EXAM_PARTS.map((p) => p.order)).toEqual([1, 2, 3, 4]);
  });
});
