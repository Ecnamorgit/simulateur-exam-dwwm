import { useState, useRef, useEffect, useCallback } from 'react';
import { evaluateOral } from '../services/api';
import { ChatMessage, Question } from '../types/exam';

interface UseInteractiveExamOptions {
  questions: Question[];
  speak: (text: string) => void;
  transcript: string;
  clearTranscript: () => void;
}

/** Logique de l'entretien technique interactif mené par l'examinateur IA. */
export function useInteractiveExam({ questions, speak, transcript, clearTranscript }: UseInteractiveExamOptions) {
  const [interactiveStarted, setInteractiveStarted] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [interactiveQuestionIdx, setInteractiveQuestionIdx] = useState(0);
  const [interactiveScore, setInteractiveScore] = useState(0);
  const [interactiveTotal, setInteractiveTotal] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [candidateInput, setCandidateInput] = useState('');
  const [interactiveContext, setInteractiveContext] = useState<{ question: string; answer: string }[]>([]);
  const [sessionComplete, setSessionComplete] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const maxInteractiveQuestions = 10;

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const interactiveJuryQuestions = questions.filter((q) => q.type === 'jury');

  const startInteractiveSession = useCallback(() => {
    // Unlock audio context synchronously during user click
    const dummyAudio = new Audio();
    dummyAudio.play().catch(() => {});

    window.speechSynthesis?.cancel();
    setInteractiveStarted(true);
    setSessionComplete(false);
    setChatMessages([]);
    setInteractiveQuestionIdx(0);
    setInteractiveScore(0);
    setInteractiveTotal(0);
    setInteractiveContext([]);
    setCandidateInput('');

    const firstQ = interactiveJuryQuestions[0];
    if (firstQ) {
      const greeting: ChatMessage = {
        role: 'examiner',
        text: `Bonjour, je suis votre examinateur pour la certification DWWM. Nous allons commencer l'entretien technique. Voici ma première question :`,
      };
      const question: ChatMessage = { role: 'examiner', text: firstQ.question_text };
      setChatMessages([greeting, question]);
      speak(`Bonjour, je suis votre examinateur pour la certification DWWM. Voici ma première question : ${firstQ.question_text}`);
    }
  }, [interactiveJuryQuestions, speak]);

  const submitAnswer = useCallback(async (answerText?: string) => {
    const answer = answerText || candidateInput || transcript;
    if (!answer.trim() || isEvaluating) return;

    const currentQ = interactiveJuryQuestions[interactiveQuestionIdx];
    if (!currentQ) return;

    setChatMessages((prev) => [...prev, { role: 'candidate', text: answer }]);
    setCandidateInput('');
    clearTranscript();
    setIsEvaluating(true);

    try {
      const evalResult = await evaluateOral({
        question: currentQ.question_text,
        user_answer: answer,
        context: interactiveContext,
      });

      setInteractiveContext((prev) => [...prev, { question: currentQ.question_text, answer }]);
      setInteractiveScore((prev) => prev + (evalResult.score || 0));
      setInteractiveTotal((prev) => prev + 1);

      const feedbackMsg: ChatMessage = {
        role: 'system',
        text: evalResult.feedback || 'Réponse enregistrée.',
        score: evalResult.score,
        detectedKeywords: evalResult.detected_keywords,
        missingKeywords: evalResult.missing_keywords,
      };
      setChatMessages((prev) => [...prev, feedbackMsg]);

      const nextIdx = interactiveQuestionIdx + 1;
      const hasFollowUp = evalResult.is_follow_up && evalResult.follow_up_question;

      if (hasFollowUp) {
        setTimeout(() => {
          const followUp: ChatMessage = { role: 'examiner', text: evalResult.follow_up_question };
          setChatMessages((prev) => [...prev, followUp]);
          speak(evalResult.follow_up_question);
        }, 1500);
      } else if (nextIdx < interactiveJuryQuestions.length && nextIdx < maxInteractiveQuestions) {
        setInteractiveQuestionIdx(nextIdx);
        setTimeout(() => {
          const nextQ = interactiveJuryQuestions[nextIdx];
          const nextMsg: ChatMessage = { role: 'examiner', text: nextQ.question_text };
          setChatMessages((prev) => [...prev, nextMsg]);
          speak(nextQ.question_text);
        }, 2000);
      } else {
        setTimeout(() => {
          setSessionComplete(true);
          const avg = interactiveTotal > 0 ? ((interactiveScore + (evalResult.score || 0)) / (interactiveTotal + 1)).toFixed(1) : '0';
          const endMsg: ChatMessage = {
            role: 'examiner',
            text: `L'entretien est terminé. Votre score moyen est de ${avg}/10. ${Number(avg) >= 7 ? 'Excellent travail, vous êtes bien préparé !' : Number(avg) >= 5 ? 'C\'est correct, continuez à réviser les points faibles.' : 'Je vous recommande de revoir les fondamentaux avant le jour J.'}`,
          };
          setChatMessages((prev) => [...prev, endMsg]);
          speak(endMsg.text);
        }, 2000);
      }
    } catch (err) {
      console.error('Eval error:', err);
      setChatMessages((prev) => [...prev, {
        role: 'system',
        text: 'Erreur de connexion au serveur d\'évaluation. Vérifiez que le backend est en cours d\'exécution.',
      }]);
    } finally {
      setIsEvaluating(false);
    }
  }, [candidateInput, transcript, interactiveQuestionIdx, interactiveJuryQuestions, isEvaluating, interactiveContext, interactiveScore, interactiveTotal, speak, clearTranscript]);

  // Clôture forcée de la session (ex. quand le temps imparti est écoulé).
  const finishSession = useCallback(() => {
    if (sessionComplete) return;
    setSessionComplete(true);
    const avg = interactiveTotal > 0 ? (interactiveScore / interactiveTotal).toFixed(1) : '0';
    const endMsg: ChatMessage = {
      role: 'examiner',
      text: `Le temps imparti est écoulé. L'entretien technique est terminé. Votre score moyen est de ${avg}/10.`,
    };
    setChatMessages((prev) => [...prev, endMsg]);
    speak(endMsg.text);
  }, [sessionComplete, interactiveScore, interactiveTotal, speak]);

  return {
    interactiveStarted,
    chatMessages,
    finishSession,
    interactiveQuestionIdx,
    interactiveScore,
    interactiveTotal,
    isEvaluating,
    candidateInput,
    setCandidateInput,
    sessionComplete,
    chatEndRef,
    maxInteractiveQuestions,
    interactiveJuryQuestions,
    startInteractiveSession,
    submitAnswer,
  };
}
