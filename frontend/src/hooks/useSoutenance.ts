import { useState, useEffect } from 'react';
import { evaluateSoutenance } from '../services/api';
import { SoutenanceReport, Question } from '../types/exam';

interface Timer {
  timeLeft: number;
  setTimeLeft: (n: number) => void;
  timerRunning: boolean;
  setTimerRunning: (b: boolean) => void;
  toggleTimer: () => void;
  resetTimer: (seconds?: number) => void;
}

interface UseSoutenanceOptions {
  speak: (text: string) => void;
  transcript: string;
  clearTranscript: () => void;
  isListening: boolean;
  hasSupport: boolean;
  startListening: () => void;
  stopListening: () => void;
  selectedFile: File | null;
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  timer: Timer;
}

/** Logique de la soutenance orale de 35 minutes évaluée par le jury IA. */
export function useSoutenance(opts: UseSoutenanceOptions) {
  const { speak, transcript, clearTranscript, isListening, hasSupport, startListening, stopListening, selectedFile, setQuestions, timer } = opts;

  const [showSoutenanceModal, setShowSoutenanceModal] = useState(false);
  const [soutenanceStarted, setSoutenanceStarted] = useState(false);
  const [evaluatingSoutenance, setEvaluatingSoutenance] = useState(false);
  const [soutenanceReport, setSoutenanceReport] = useState<SoutenanceReport | null>(null);
  const [accumulatedTranscript, setAccumulatedTranscript] = useState('');

  // Accumulate speech transcript during soutenance
  useEffect(() => {
    if (soutenanceStarted && transcript) {
      setAccumulatedTranscript((prev) => {
        if (!prev.includes(transcript)) {
          return prev ? `${prev} ${transcript}` : transcript;
        }
        return prev;
      });
    }
  }, [soutenanceStarted, transcript]);

  const startSoutenanceNow = () => {
    setSoutenanceStarted(true);
    setSoutenanceReport(null);
    setAccumulatedTranscript('');
    clearTranscript();
    timer.setTimeLeft(35 * 60);
    timer.setTimerRunning(true);
    if (hasSupport) startListening();
    speak('Bonjour ! Le jury vous écoute. Vous avez 35 minutes pour présenter votre projet.');
  };

  const handleStartSoutenanceClick = () => {
    if (!soutenanceStarted && !timer.timerRunning) {
      setShowSoutenanceModal(true);
    } else {
      timer.toggleTimer();
    }
  };

  const confirmStartSoutenance = (mode: 'dossier' | 'generic') => {
    setShowSoutenanceModal(false);
    if (mode === 'dossier' && !selectedFile) {
      const uploadElem = document.getElementById('soutenance-file-upload');
      if (uploadElem) uploadElem.click();
      return;
    }
    startSoutenanceNow();
  };

  const submitSoutenancePresentation = async () => {
    timer.setTimerRunning(false);
    if (isListening) stopListening();
    setEvaluatingSoutenance(true);

    const fullText = accumulatedTranscript || transcript || "Présentation orale effectuée par l'étudiant.";
    const elapsedSecs = (35 * 60) - timer.timeLeft;

    try {
      const report = await evaluateSoutenance({
        transcript: fullText,
        dossier_text: selectedFile ? `Fichier analysé : ${selectedFile.name}` : '',
        duration_seconds: elapsedSecs,
      });
      setSoutenanceReport(report);

      speak(`Merci. Le jury a analysé votre présentation. Votre note globale est de ${report.overall_score} sur 100. Voici les questions spécifiques du jury.`);

      if (report.custom_jury_questions && report.custom_jury_questions.length > 0) {
        const newQuestions: Question[] = report.custom_jury_questions.map((q: any) => ({
          type: 'jury',
          category: q.category || 'Projet',
          question_text: q.question_text,
          correct_answer: q.context_reason || 'Réponse argumentée basée sur la soutenance',
          explanation: `Question du jury liée à la soutenance : ${q.context_reason}`,
        }));
        setQuestions((prev) => [...newQuestions, ...prev]);
      }
    } catch (err) {
      console.error('Soutenance eval error:', err);
    } finally {
      setEvaluatingSoutenance(false);
    }
  };

  const resetSoutenance = () => {
    timer.resetTimer();
    setSoutenanceStarted(false);
    setSoutenanceReport(null);
  };

  return {
    showSoutenanceModal,
    setShowSoutenanceModal,
    soutenanceStarted,
    evaluatingSoutenance,
    soutenanceReport,
    accumulatedTranscript,
    handleStartSoutenanceClick,
    confirmStartSoutenance,
    startSoutenanceNow,
    submitSoutenancePresentation,
    resetSoutenance,
  };
}
