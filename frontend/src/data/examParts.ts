/**
 * Déroulé officiel de l'épreuve de certification DWWM (RNCP 37674) — 2 h 00 au total.
 * Source unique pour l'écran « Déroulé de l'épreuve » et le mode examen blanc.
 */

export type ExamPartId = 'soutenance' | 'entretien-technique' | 'questionnaire' | 'entretien-final';

export interface ExamPart {
  id: ExamPartId;
  order: number;
  title: string;
  durationMin: number;
  icon: string;
  description: string;
}

export const EXAM_PARTS: ExamPart[] = [
  {
    id: 'soutenance',
    order: 1,
    title: 'Présentation du projet (soutenance)',
    durationMin: 35,
    icon: '🎤',
    description: "Présentation orale de votre projet devant le jury : contexte, conception UX/UI, démonstration, architecture et bilan.",
  },
  {
    id: 'entretien-technique',
    order: 2,
    title: 'Entretien technique',
    durationMin: 40,
    icon: '💬',
    description: "Le jury vous interroge sur les compétences techniques mises en œuvre, en priorité à partir de votre soutenance.",
  },
  {
    id: 'questionnaire',
    order: 3,
    title: 'Questionnaire professionnel',
    durationMin: 30,
    icon: '📄',
    description: "Étude d'une documentation technique en anglais, puis 2 questions fermées en français et 2 questions ouvertes en anglais.",
  },
  {
    id: 'entretien-final',
    order: 4,
    title: 'Entretien final',
    durationMin: 15,
    icon: '🤝',
    description: "Échange sur la compréhension du métier, la posture professionnelle, votre parcours et votre Dossier Professionnel (DP).",
  },
];

export const TOTAL_EXAM_MINUTES = EXAM_PARTS.reduce((sum, p) => sum + p.durationMin, 0); // 120
