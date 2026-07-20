import React, { useEffect } from 'react';
import InteractiveExaminer from './InteractiveExaminer';
import { useInteractiveExam } from '../../hooks/useInteractiveExam';
import { useExamTimer, formatTime } from '../../hooks/useExamTimer';
import { Question } from '../../types/exam';

interface Props {
  questions: Question[];
  speak: (text: string) => void;
  ttsEnabled: boolean;
  setTtsEnabled: (v: boolean) => void;
  transcript: string;
  isListening: boolean;
  hasSupport: boolean;
  startListening: () => void;
  stopListening: () => void;
  clearTranscript: () => void;
  onBack: () => void;
}

const DURATION = 40 * 60;

/**
 * Épreuve « Entretien technique » (40 min). Réutilise l'examinateur IA interactif
 * avec un chronomètre de 40 minutes et une clôture automatique en fin de temps.
 * Les questions issues de la soutenance sont prioritaires (préfixées dans `questions`).
 */
const EntretienTechnique: React.FC<Props> = ({
  questions, speak, ttsEnabled, setTtsEnabled,
  transcript, isListening, hasSupport, startListening, stopListening, clearTranscript, onBack,
}) => {
  const interactive = useInteractiveExam({ questions, speak, transcript, clearTranscript });
  const timer = useExamTimer(DURATION);

  // Clôture automatique lorsque le temps est écoulé.
  useEffect(() => {
    if (interactive.interactiveStarted && !interactive.sessionComplete && timer.timeLeft === 0) {
      timer.setTimerRunning(false);
      interactive.finishSession();
    }
  }, [timer.timeLeft, interactive.interactiveStarted, interactive.sessionComplete]);

  // Arrête le chrono dès que la session se termine (par le temps ou par les questions).
  useEffect(() => {
    if (interactive.sessionComplete) timer.setTimerRunning(false);
  }, [interactive.sessionComplete]);

  const handleStart = () => {
    interactive.startInteractiveSession();
    timer.resetTimer(DURATION);
    timer.setTimerRunning(true);
  };

  return (
    <section className="tab-content fade-in">
      <div className="card-soft page-intro-card entretien-head">
        <div className="entretien-head-row">
          <button className="btn-outline-pill" onClick={onBack}>← Retour au déroulé</button>
          <span className={`epreuve-timer ${timer.timeLeft <= 60 && interactive.interactiveStarted ? 'urgent' : ''}`}>
            ⏱ {formatTime(timer.timeLeft)}
          </span>
        </div>
        <h3 className="card-title">Entretien technique (40 min)</h3>
        <p className="card-subtitle">
          Le jury vous interroge à l'oral. Les questions issues de votre soutenance sont posées en priorité.
          L'entretien se clôt automatiquement à la fin du temps imparti.
        </p>
      </div>

      <InteractiveExaminer
        interactiveStarted={interactive.interactiveStarted}
        chatMessages={interactive.chatMessages}
        interactiveQuestionIdx={interactive.interactiveQuestionIdx}
        interactiveScore={interactive.interactiveScore}
        interactiveTotal={interactive.interactiveTotal}
        isEvaluating={interactive.isEvaluating}
        candidateInput={interactive.candidateInput}
        setCandidateInput={interactive.setCandidateInput}
        sessionComplete={interactive.sessionComplete}
        chatEndRef={interactive.chatEndRef}
        maxInteractiveQuestions={interactive.maxInteractiveQuestions}
        interactiveJuryQuestions={interactive.interactiveJuryQuestions}
        startInteractiveSession={handleStart}
        submitAnswer={interactive.submitAnswer}
        ttsEnabled={ttsEnabled}
        setTtsEnabled={setTtsEnabled}
        hasSupport={hasSupport}
        isListening={isListening}
        startListening={startListening}
        stopListening={stopListening}
        transcript={transcript}
      />
    </section>
  );
};

export default EntretienTechnique;
