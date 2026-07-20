import { useState } from 'react';
import { getQuestionnaire, evaluateQuestionnaire } from '../services/api';
import { Questionnaire, QuestionnaireResult } from '../types/exam';

/** Charge un questionnaire professionnel et gère la saisie + la correction. */
export function useQuestionnaire() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Questionnaire | null>(null);
  const [closedAnswers, setClosedAnswers] = useState<string[]>([]);
  const [openAnswers, setOpenAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<QuestionnaireResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = async (stack: string = '') => {
    setLoading(true);
    setError('');
    setResult(null);
    setData(null);
    try {
      const d: Questionnaire = await getQuestionnaire(stack);
      setData(d);
      setClosedAnswers(new Array(d.closed_questions.length).fill(''));
      setOpenAnswers(new Array(d.open_questions.length).fill(''));
    } catch (e) {
      console.error(e);
      setError("Impossible de charger le questionnaire. Vérifiez que le backend est démarré.");
    } finally {
      setLoading(false);
    }
  };

  const setClosedAnswer = (idx: number, choice: string) => {
    setClosedAnswers((prev) => prev.map((v, i) => (i === idx ? choice : v)));
  };

  const setOpenAnswer = (idx: number, text: string) => {
    setOpenAnswers((prev) => prev.map((v, i) => (i === idx ? text : v)));
  };

  const submit = async () => {
    if (!data) return;
    setSubmitting(true);
    try {
      const r: QuestionnaireResult = await evaluateQuestionnaire({
        documentation: data.documentation,
        closed_questions: data.closed_questions,
        closed_answers: closedAnswers,
        open_questions: data.open_questions.map((q) => q.question),
        open_answers: openAnswers,
      });
      setResult(r);
    } catch (e) {
      console.error(e);
      setError("Erreur lors de l'évaluation du questionnaire.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    loading, data, closedAnswers, openAnswers, result, submitting, error,
    load, setClosedAnswer, setOpenAnswer, submit,
  };
}
