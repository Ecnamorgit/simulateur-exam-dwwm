import { useState, useEffect, useRef } from 'react';
import { evaluateSoutenance } from '../services/api';
import { SoutenanceReport, Question } from '../types/exam';
import { extractPresentationText } from '../utils/presentationLoader';

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
  /** Texte brut extrait du dossier de projet (fourni par useDossier). */
  dossierText?: string;
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  timer: Timer;
}

/** Logique de la soutenance orale de 35 minutes évaluée par le jury IA. */
export function useSoutenance(opts: UseSoutenanceOptions) {
  const { speak, transcript, clearTranscript, isListening, hasSupport, startListening, stopListening, selectedFile, dossierText, setQuestions, timer } = opts;

  const [showSoutenanceModal, setShowSoutenanceModal] = useState(false);
  const [soutenanceStarted, setSoutenanceStarted] = useState(false);
  const [evaluatingSoutenance, setEvaluatingSoutenance] = useState(false);
  const [soutenanceReport, setSoutenanceReport] = useState<SoutenanceReport | null>(null);
  const [accumulatedTranscript, setAccumulatedTranscript] = useState('');
  // Saisie clavier de repli quand la reconnaissance vocale n'est pas supportée.
  const [manualTranscript, setManualTranscript] = useState('');
  const [soutenanceError, setSoutenanceError] = useState<string | null>(null);
  // Fichier de présentation (PPTX / PDF / images) affiché dans un panneau flottant.
  const [presentationFile, setPresentationFile] = useState<File | null>(null);
  const [presentationPanelOpen, setPresentationPanelOpen] = useState(false);
  const lastTranscriptRef = useRef('');

  const handlePresentationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPresentationFile(file);
    if (file) setPresentationPanelOpen(true);
  };

  const openPresentationWindow = () => {
    if (presentationFile) setPresentationPanelOpen(true);
  };
  const closePresentationWindow = () => setPresentationPanelOpen(false);

  // Accumulate speech transcript during soutenance seamlessly without dropping words
  useEffect(() => {
    if (soutenanceStarted && transcript) {
      if (transcript !== lastTranscriptRef.current) {
        setAccumulatedTranscript((prev) => {
          if (lastTranscriptRef.current && transcript.startsWith(lastTranscriptRef.current)) {
            const added = transcript.slice(lastTranscriptRef.current.length);
            return prev + added;
          }
          return prev ? `${prev} ${transcript}` : transcript;
        });
        lastTranscriptRef.current = transcript;
      }
    }
  }, [soutenanceStarted, transcript]);

  const startSoutenanceNow = () => {
    setSoutenanceStarted(true);
    setSoutenanceReport(null);
    setAccumulatedTranscript('');
    lastTranscriptRef.current = '';
    clearTranscript();
    timer.setTimeLeft(35 * 60);
    timer.setTimerRunning(true);
    if (hasSupport) startListening();
    // Ouvre automatiquement le panneau de présentation si un fichier a été chargé.
    if (presentationFile) setPresentationPanelOpen(true);
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
    // Cas « dossier demandé mais pas encore chargé » : on ouvre le sélecteur
    // natif SANS fermer le modal (sinon React démonte l'<input file> avant
    // que le navigateur puisse propager l'événement `change`, et l'utilisateur
    // se retrouve sans dossier ni soutenance démarrée → boucle infinie).
    // La fermeture et le démarrage seront faits dans onFileSelected.
    if (mode === 'dossier' && !selectedFile) {
      const uploadElem = document.getElementById('soutenance-file-upload');
      if (uploadElem) uploadElem.click();
      return;
    }
    setShowSoutenanceModal(false);
    startSoutenanceNow();
  };

  const submitSoutenancePresentation = async () => {
    timer.setTimerRunning(false);
    if (isListening) stopListening();
    setEvaluatingSoutenance(true);
    setSoutenanceError(null);

    const fullText = accumulatedTranscript || manualTranscript || transcript || "Présentation orale effectuée par l'étudiant.";
    const elapsedSecs = (35 * 60) - timer.timeLeft;

    // Extraction du texte du support de présentation (PPTX / PDF) pour que
    // l'IA puisse croiser slides + dossier + oral. Silencieux en cas d'échec
    // pour ne pas bloquer l'évaluation. Tronqué à 5000 car. côté client aussi
    // pour éviter les payloads massifs qui timeoutent le serveur.
    let presentationText = '';
    if (presentationFile) {
      try {
        const raw = await extractPresentationText(presentationFile);
        presentationText = raw.slice(0, 5000);
      } catch (e) {
        console.warn('Extraction du texte de la présentation impossible :', e);
      }
    }

    // Priorité au vrai contenu extrait du dossier ; fallback sur le nom de
    // fichier si l'upload a échoué (mieux que rien pour le contexte LLM).
    const dossierPayload = (dossierText && dossierText.trim().length > 0
      ? dossierText
      : (selectedFile ? `Fichier analysé : ${selectedFile.name}` : '')).slice(0, 5000);

    const transcriptPayload = fullText.slice(0, 8000);

    try {
      const report = await evaluateSoutenance({
        transcript: transcriptPayload,
        dossier_text: dossierPayload,
        presentation_text: presentationText,
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
    } catch (err: any) {
      console.error('Soutenance eval error:', err);
      const msg = err?.message || "L'évaluation par le jury a échoué. Vérifiez que le backend est démarré, puis réessayez.";
      setSoutenanceError(msg);
    } finally {
      setEvaluatingSoutenance(false);
    }
  };

  const resetSoutenance = () => {
    timer.resetTimer();
    setSoutenanceStarted(false);
    setSoutenanceReport(null);
    setPresentationPanelOpen(false);
  };

  return {
    showSoutenanceModal,
    setShowSoutenanceModal,
    soutenanceStarted,
    evaluatingSoutenance,
    soutenanceReport,
    accumulatedTranscript,
    manualTranscript,
    setManualTranscript,
    handleStartSoutenanceClick,
    confirmStartSoutenance,
    startSoutenanceNow,
    submitSoutenancePresentation,
    resetSoutenance,
    presentationFile,
    handlePresentationFileChange,
    openPresentationWindow,
    closePresentationWindow,
    presentationPanelOpen,
    soutenanceError,
  };
}
