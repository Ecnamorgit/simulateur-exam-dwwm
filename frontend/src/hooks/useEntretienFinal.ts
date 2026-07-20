import { useState, useCallback } from 'react';
import { getFinalQuestions, evaluateFinalAnswer } from '../services/api';
import { ChatMessage } from '../types/exam';

/** Logique de l'entretien final : questions non techniques + évaluation savoir-être. */
export function useEntretienFinal(speak: (t: string) => void) {
  const [questions, setQuestions] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [scoreSum, setScoreSum] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [started, setStarted] = useState(false);
  const [complete, setComplete] = useState(false);

  const start = useCallback(async () => {
    const qs = await getFinalQuestions();
    setQuestions(qs);
    setStarted(true);
    setComplete(false);
    setIdx(0);
    setScoreSum(0);
    setAnswered(0);
    setInput('');
    const intro = "Bonjour, nous terminons par un court échange sur votre profil professionnel.";
    setMessages([{ role: 'examiner', text: intro }, { role: 'examiner', text: qs[0] }]);
    speak(`${intro} ${qs[0]}`);
  }, [speak]);

  const finish = useCallback((lastScore: number, count: number) => {
    setComplete(true);
    const avg = count > 0 ? (lastScore / count).toFixed(1) : '0';
    const msg = `Merci, l'entretien final est terminé. Note de savoir-être moyenne : ${avg}/10. `
      + (Number(avg) >= 7 ? 'Posture professionnelle convaincante.' : 'Continuez à travailler la clarté et la posture.');
    setMessages((prev) => [...prev, { role: 'examiner', text: msg }]);
    speak(msg);
  }, [speak]);

  const submit = useCallback(async () => {
    const answer = input.trim();
    if (!answer || isEvaluating || complete) return;
    const currentQ = questions[idx];
    setMessages((prev) => [...prev, { role: 'candidate', text: answer }]);
    setInput('');
    setIsEvaluating(true);
    try {
      const res = await evaluateFinalAnswer(currentQ, answer);
      const newSum = scoreSum + (res.score || 0);
      const newCount = answered + 1;
      setScoreSum(newSum);
      setAnswered(newCount);
      setMessages((prev) => [...prev, { role: 'system', text: res.feedback || 'Réponse enregistrée.', score: res.score }]);

      const nextIdx = idx + 1;
      if (nextIdx < questions.length) {
        setIdx(nextIdx);
        setTimeout(() => {
          setMessages((prev) => [...prev, { role: 'examiner', text: questions[nextIdx] }]);
          speak(questions[nextIdx]);
        }, 1200);
      } else {
        setTimeout(() => finish(newSum, newCount), 1200);
      }
    } catch (e) {
      console.error(e);
      setMessages((prev) => [...prev, { role: 'system', text: "Erreur de connexion au serveur d'évaluation." }]);
    } finally {
      setIsEvaluating(false);
    }
  }, [input, isEvaluating, complete, questions, idx, scoreSum, answered, speak, finish]);

  return {
    questions, messages, idx, input, setInput, scoreSum, answered,
    isEvaluating, started, complete, start, submit, finish,
  };
}
