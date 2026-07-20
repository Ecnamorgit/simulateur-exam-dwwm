import { Question } from '../data/dwwmQuestions';

export type { Question };

export interface Task {
  id: string;
  title: string;
  points: number;
  status: 'backlog' | 'progress' | 'done';
}

export interface ChatMessage {
  role: 'examiner' | 'candidate' | 'system';
  text: string;
  score?: number;
  detectedKeywords?: string[];
  missingKeywords?: string[];
}

export interface SoutenanceReport {
  overall_score: number;
  time_management_score: number;
  technical_depth_score: number;
  clarity_score: number;
  phases_covered: { phase: string; detected: boolean; feedback: string }[];
  strengths: string[];
  areas_for_improvement: string[];
  custom_jury_questions: { question_text: string; category: string; context_reason: string }[];
}

export interface AnalysisResult {
  score: number;
  criteria: { name: string; checked: boolean; feedback: string }[];
}
