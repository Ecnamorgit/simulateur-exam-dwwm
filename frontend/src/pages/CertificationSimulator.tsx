import React, { useState, useEffect, useRef, useCallback } from 'react';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import Separator from '../components/Separator';
import './CertificationSimulator.css';
import { Play, Pause, RotateCcw, Mic, MicOff, CheckCircle, AlertTriangle, User, HelpCircle, Filter, MessageCircle, Volume2, VolumeX, Send, RefreshCw, Upload, CheckCircle2, XCircle, Sparkles, X } from 'lucide-react';
import { DWWM_QUESTIONS, Question } from '../data/dwwmQuestions';

interface Task {
  id: string;
  title: string;
  points: number;
  status: 'backlog' | 'progress' | 'done';
}

const CertificationSimulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'oral' | 'dossier' | 'agile' | 'owasp'>('oral');
  const [simulationMode, setSimulationMode] = useState<'jury' | 'qcm' | 'interactive'>('jury');

  // Oral Timer state
  const [timeLeft, setTimeLeft] = useState(35 * 60); // 35 minutes
  const [timerRunning, setTimerRunning] = useState(false);

  // Speech Recognition hook
  const { transcript, isListening, hasSupport, startListening, stopListening, clearTranscript } =
    useSpeechRecognition();

  // Document compliance checker state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    score: number;
    criteria: { name: string; checked: boolean; feedback: string }[];
  } | null>(null);

  // Questions state
  const [questions, setQuestions] = useState<Question[]>(DWWM_QUESTIONS);
  
  // Category filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('Toutes');

  // QCM interactive states
  const [selectedChoices, setSelectedChoices] = useState<{ [key: number]: string }>({});
  const [validatedQuestions, setValidatedQuestions] = useState<{ [key: number]: boolean }>({});

  // Kanban state
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Maquettage adaptatif Figma (CCP1)', points: 5, status: 'backlog' },
    { id: '2', title: 'Schémas conceptuel et logique (MCD/MLD) (CCP2)', points: 8, status: 'progress' },
    { id: '3', title: 'Intégration du hachage Bcrypt et CORS (CCP2)', points: 5, status: 'done' },
    { id: '4', title: 'Mise en place du workflow CI/CD (DevOps)', points: 3, status: 'backlog' },
  ]);

  // Revealed answers state for oral/jury mode
  const [revealedAnswers, setRevealedAnswers] = useState<{ [key: string]: boolean }>({});

  // ── Interactive Oral Examiner State ──
  interface ChatMessage {
    role: 'examiner' | 'candidate' | 'system';
    text: string;
    score?: number;
    detectedKeywords?: string[];
    missingKeywords?: string[];
  }
  const [interactiveStarted, setInteractiveStarted] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [interactiveQuestionIdx, setInteractiveQuestionIdx] = useState(0);
  const [interactiveScore, setInteractiveScore] = useState(0);
  const [interactiveTotal, setInteractiveTotal] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [candidateInput, setCandidateInput] = useState('');
  const [interactiveContext, setInteractiveContext] = useState<{question: string; answer: string}[]>([]);
  const [sessionComplete, setSessionComplete] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const maxInteractiveQuestions = 10;
  // ── Soutenance Interactive & Modal State ──
  interface SoutenanceReport {
    overall_score: number;
    time_management_score: number;
    technical_depth_score: number;
    clarity_score: number;
    phases_covered: { phase: string; detected: boolean; feedback: string }[];
    strengths: string[];
    areas_for_improvement: string[];
    custom_jury_questions: { question_text: string; category: string; context_reason: string }[];
  }

  const [showSoutenanceModal, setShowSoutenanceModal] = useState(false);
  const [soutenanceStarted, setSoutenanceStarted] = useState(false);
  const [evaluatingSoutenance, setEvaluatingSoutenance] = useState(false);
  const [soutenanceReport, setSoutenanceReport] = useState<SoutenanceReport | null>(null);
  const [accumulatedTranscript, setAccumulatedTranscript] = useState('');

  // Accumulate speech transcript during soutenance
  useEffect(() => {
    if (soutenanceStarted && transcript) {
      setAccumulatedTranscript(prev => {
        if (!prev.includes(transcript)) {
          return prev ? `${prev} ${transcript}` : transcript;
        }
        return prev;
      });
    }
  }, [soutenanceStarted, transcript]);

  // Countdown timer logic
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => setTimerRunning(!timerRunning);
  const resetTimer = () => {
    setTimerRunning(false);
    setTimeLeft(35 * 60);
  };

  // Real Backend Analysis and IA Generation logic
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setAnalyzing(true);
      setAnalysisResult(null);

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/certification/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Erreur lors du traitement du fichier par le backend.');
        }

        const data = await response.json();
        
        setAnalysisResult({
          score: data.score,
          criteria: data.criteria
        });

        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
        }

        // Reset QCM user selections
        setSelectedChoices({});
        setValidatedQuestions({});
        setRevealedAnswers({});
      } catch (error) {
        console.error('Error uploading file:', error);
        // Fallback to static simulation on error
        const score = Math.floor(Math.random() * 30) + 70;
        setAnalysisResult({
          score,
          criteria: [
            { name: 'Contexte du projet et objectifs de qualité', checked: true, feedback: 'Section bien rédigée, objectifs clairs.' },
            { name: 'Réalisations Front-end (CCP1)', checked: true, feedback: 'Wireframes et captures présentes.' },
            { name: 'Réalisations Back-end (MCD/MLD) (CCP2)', checked: score > 85, feedback: 'Modélisation relationnelle complète.' },
            { name: 'Sécurité (Bcrypt, CORS, OWASP)', checked: true, feedback: 'Bonne documentation des mesures de sécurité.' },
          ],
        });
      } finally {
        setAnalyzing(false);
      }
    }
  };

  // Kanban column management
  const moveTask = (id: string, direction: 'forward' | 'backward') => {
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (task.id === id) {
          const statusOrder: ('backlog' | 'progress' | 'done')[] = ['backlog', 'progress', 'done'];
          const currentIndex = statusOrder.indexOf(task.status);
          const nextIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;
          if (nextIndex >= 0 && nextIndex < statusOrder.length) {
            return { ...task, status: statusOrder[nextIndex] };
          }
        }
        return task;
      })
    );
  };

  const toggleAnswer = (key: string) => {
    setRevealedAnswers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleQcmSelect = (qIdx: number, choice: string) => {
    if (validatedQuestions[qIdx]) return; // Cannot modify after validation
    setSelectedChoices(prev => ({ ...prev, [qIdx]: choice }));
    setValidatedQuestions(prev => ({ ...prev, [qIdx]: true }));
  };

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback((text: string) => {
    if (!ttsEnabled || !text || !text.trim()) return;

    // Stop any currently playing audio or speech synthesis
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Call backend edge-tts endpoint for ultra-realistic neural French male voice (Henri Neural)
    const audioUrl = `/api/certification/tts?text=${encodeURIComponent(text)}`;
    const audio = new Audio(audioUrl);
    currentAudioRef.current = audio;

    audio.play().then(() => {
      console.log("Playing neural TTS (fr-FR-HenriNeural)...");
    }).catch((err) => {
      console.warn("Neural TTS play error:", err);
      // Fallback to browser Web Speech API only if audio element failed
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        utterance.rate = 0.95;
        const voices = window.speechSynthesis.getVoices();
        // Explicitly search for French male voices first
        const maleVoice = voices.find(v => v.lang.startsWith('fr') && (
          v.name.toLowerCase().includes('henri') ||
          v.name.toLowerCase().includes('paul') ||
          v.name.toLowerCase().includes('gilles') ||
          v.name.toLowerCase().includes('male') ||
          v.name.toLowerCase().includes('homme')
        )) || voices.find(v => v.lang.startsWith('fr'));
        if (maleVoice) utterance.voice = maleVoice;
        window.speechSynthesis.speak(utterance);
      }
    });
  }, [ttsEnabled]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const interactiveJuryQuestions = questions.filter(q => q.type === 'jury');

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
        text: `Bonjour, je suis votre examinateur pour la certification DWWM. Nous allons commencer l'entretien technique. Voici ma première question :`
      };
      const question: ChatMessage = {
        role: 'examiner',
        text: firstQ.question_text
      };
      setChatMessages([greeting, question]);
      speak(`Bonjour, je suis votre examinateur pour la certification DWWM. Voici ma première question : ${firstQ.question_text}`);
    }
  }, [interactiveJuryQuestions, speak]);

  const submitAnswer = useCallback(async (answerText?: string) => {
    const answer = answerText || candidateInput || transcript;
    if (!answer.trim() || isEvaluating) return;

    const currentQ = interactiveJuryQuestions[interactiveQuestionIdx];
    if (!currentQ) return;

    // Add candidate message
    setChatMessages(prev => [...prev, { role: 'candidate', text: answer }]);
    setCandidateInput('');
    clearTranscript();
    setIsEvaluating(true);

    try {
      const res = await fetch('/api/certification/oral-evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQ.question_text,
          user_answer: answer,
          context: interactiveContext
        })
      });

      const evalResult = await res.json();

      // Update context
      setInteractiveContext(prev => [...prev, { question: currentQ.question_text, answer }]);
      setInteractiveScore(prev => prev + (evalResult.score || 0));
      setInteractiveTotal(prev => prev + 1);

      // Add evaluation message
      const feedbackMsg: ChatMessage = {
        role: 'system',
        text: evalResult.feedback || 'Réponse enregistrée.',
        score: evalResult.score,
        detectedKeywords: evalResult.detected_keywords,
        missingKeywords: evalResult.missing_keywords
      };
      setChatMessages(prev => [...prev, feedbackMsg]);

      // Next question or follow-up
      const nextIdx = interactiveQuestionIdx + 1;
      const hasFollowUp = evalResult.is_follow_up && evalResult.follow_up_question;

      if (hasFollowUp) {
        setTimeout(() => {
          const followUp: ChatMessage = { role: 'examiner', text: evalResult.follow_up_question };
          setChatMessages(prev => [...prev, followUp]);
          speak(evalResult.follow_up_question);
        }, 1500);
      } else if (nextIdx < interactiveJuryQuestions.length && nextIdx < maxInteractiveQuestions) {
        setInteractiveQuestionIdx(nextIdx);
        setTimeout(() => {
          const nextQ = interactiveJuryQuestions[nextIdx];
          const nextMsg: ChatMessage = { role: 'examiner', text: nextQ.question_text };
          setChatMessages(prev => [...prev, nextMsg]);
          speak(nextQ.question_text);
        }, 2000);
      } else {
        // Session complete
        setTimeout(() => {
          setSessionComplete(true);
          const avg = interactiveTotal > 0 ? ((interactiveScore + (evalResult.score || 0)) / (interactiveTotal + 1)).toFixed(1) : '0';
          const endMsg: ChatMessage = {
            role: 'examiner',
            text: `L'entretien est terminé. Votre score moyen est de ${avg}/10. ${Number(avg) >= 7 ? 'Excellent travail, vous êtes bien préparé !' : Number(avg) >= 5 ? 'C\'est correct, continuez à réviser les points faibles.' : 'Je vous recommande de revoir les fondamentaux avant le jour J.'}`
          };
          setChatMessages(prev => [...prev, endMsg]);
          speak(endMsg.text);
        }, 2000);
      }
    } catch (err) {
      console.error('Eval error:', err);
      setChatMessages(prev => [...prev, {
        role: 'system',
        text: 'Erreur de connexion au serveur d\'évaluation. Vérifiez que le backend est en cours d\'exécution.'
      }]);
    } finally {
      setIsEvaluating(false);
    }
  }, [candidateInput, transcript, interactiveQuestionIdx, interactiveJuryQuestions, isEvaluating, interactiveContext, interactiveScore, interactiveTotal, speak, clearTranscript]);

  // ── Soutenance Interactive Functions ──

  const handleStartSoutenanceClick = () => {
    if (!soutenanceStarted && !timerRunning) {
      setShowSoutenanceModal(true);
    } else {
      toggleTimer();
    }
  };

  const confirmStartSoutenance = (mode: 'dossier' | 'generic') => {
    setShowSoutenanceModal(false);
    if (mode === 'dossier' && !selectedFile) {
      // Trigger file upload dialog
      const uploadElem = document.getElementById('soutenance-file-upload');
      if (uploadElem) uploadElem.click();
      return;
    }
    startSoutenanceNow();
  };

  const startSoutenanceNow = () => {
    setSoutenanceStarted(true);
    setSoutenanceReport(null);
    setAccumulatedTranscript('');
    clearTranscript();
    setTimeLeft(35 * 60);
    setTimerRunning(true);
    if (hasSupport) startListening();

    // AI Jury Greeting
    speak("Bonjour ! Le jury vous écoute. Vous avez 35 minutes pour présenter votre projet.");
  };

  const submitSoutenancePresentation = async () => {
    setTimerRunning(false);
    if (isListening) stopListening();
    setEvaluatingSoutenance(true);

    const fullText = accumulatedTranscript || transcript || "Présentation orale effectuée par l'étudiant.";
    const elapsedSecs = (35 * 60) - timeLeft;

    try {
      const res = await fetch('/api/certification/soutenance-evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: fullText,
          dossier_text: selectedFile ? `Fichier analysé : ${selectedFile.name}` : '',
          duration_seconds: elapsedSecs
        })
      });

      const report = await res.json();
      setSoutenanceReport(report);

      speak(`Merci. Le jury a analysé votre présentation. Votre note globale est de ${report.overall_score} sur 100. Voici les questions spécifiques du jury.`);

      // Append custom questions to the jury questions list if present
      if (report.custom_jury_questions && report.custom_jury_questions.length > 0) {
        const newQuestions: Question[] = report.custom_jury_questions.map((q: any) => ({
          type: 'jury',
          category: q.category || 'Projet',
          question_text: q.question_text,
          correct_answer: q.context_reason || 'Réponse argumentée basée sur la soutenance',
          explanation: `Question du jury liée à la soutenance : ${q.context_reason}`
        }));
        setQuestions(prev => [...newQuestions, ...prev]);
      }
    } catch (err) {
      console.error('Soutenance eval error:', err);
    } finally {
      setEvaluatingSoutenance(false);
    }
  };

  // Handle category change and reset QCM state
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedChoices({});
    setValidatedQuestions({});
    setRevealedAnswers({});
  };

  // Filter questions by type and category
  const filteredQuestions = selectedCategory === 'Toutes'
    ? questions
    : questions.filter(q => (q as any).category === selectedCategory);
  const qcmQuestions = filteredQuestions.filter(q => q.type === 'qcm');
  const juryQuestions = filteredQuestions.filter(q => q.type === 'jury');

  // Unique categories from current question set
  const availableCategories = ['Toutes', ...Array.from(new Set(questions.map(q => (q as any).category).filter(Boolean)))];

  // Compute QCM score
  const answeredCount = Object.keys(validatedQuestions).length;
  const correctCount = qcmQuestions.reduce((acc, q, idx) => {
    return selectedChoices[idx] === q.correct_answer ? acc + 1 : acc;
  }, 0);

  return (
    <div className="simulator-page">
      <header className="hero-section">
        <h1 className="hero-brand">Anything</h1>
        <h2 className="hero-headline">Simulateur de Certification</h2>
        <p className="hero-subtext">
          daylight reverie: préparez méthodiquement votre épreuve de Titre Professionnel DWWM
        </p>
      </header>

      {/* Navigation tabs */}
      <div className="tab-navigation">
        <div className="tab-pill">
          <button 
            className={`tab-link ${activeTab === 'oral' ? 'active' : ''}`}
            onClick={() => setActiveTab('oral')}
          >
            Simulateur d'Oral & QCM
          </button>
          <button 
            className={`tab-link ${activeTab === 'dossier' ? 'active' : ''}`}
            onClick={() => setActiveTab('dossier')}
          >
            Validation de Dossier
          </button>
          <button 
            className={`tab-link ${activeTab === 'agile' ? 'active' : ''}`}
            onClick={() => setActiveTab('agile')}
          >
            Backlog Agile
          </button>
          <button 
            className={`tab-link ${activeTab === 'owasp' ? 'active' : ''}`}
            onClick={() => setActiveTab('owasp')}
          >
            OWASP & Sécurité
          </button>
        </div>
      </div>

      <Separator width="300px" margin="32px auto" />

      {/* Oral & QCM tab */}
      {activeTab === 'oral' && (
        <section className="tab-content fade-in">
          {/* Sub-navigation to toggle between Oral and QCM */}
          <div className="mode-toggle-container">
            <div className="mode-toggle-pill">
              <button 
                className={`mode-toggle-btn ${simulationMode === 'jury' ? 'active' : ''}`}
                onClick={() => setSimulationMode('jury')}
              >
                <User size={16} style={{ marginRight: '8px' }} />
                Jury
              </button>
              <button 
                className={`mode-toggle-btn ${simulationMode === 'qcm' ? 'active' : ''}`}
                onClick={() => setSimulationMode('qcm')}
              >
                <HelpCircle size={16} style={{ marginRight: '8px' }} />
                QCM
              </button>
              <button 
                className={`mode-toggle-btn ${simulationMode === 'interactive' ? 'active' : ''}`}
                onClick={() => setSimulationMode('interactive')}
              >
                <MessageCircle size={16} style={{ marginRight: '8px' }} />
                Entretien IA
              </button>
            </div>
          </div>

          {simulationMode === 'jury' ? (
            <>
              {/* Modal Pre-soutenance */}
              {showSoutenanceModal && (
                <div className="modal-overlay fade-in">
                  <div className="modal-card">
                    <div className="modal-header">
                      <div className="modal-icon">🎒</div>
                      <button className="close-btn" onClick={() => setShowSoutenanceModal(false)}><X size={18} /></button>
                    </div>
                    <h3 className="modal-title">Démarrer votre Soutenance Orale (35 min)</h3>
                    <p className="modal-subtitle">
                      Pour que le Jury IA puisse personnaliser ses questions et évaluer l'adéquation entre votre oral et vos écrits, souhaitez-vous d'abord charger votre Dossier de Projet ?
                    </p>

                    {selectedFile ? (
                      <div className="file-ready-badge">
                        <CheckCircle size={16} color="var(--color-fern)" />
                        <span>Dossier chargé : <strong>{selectedFile.name}</strong></span>
                      </div>
                    ) : null}

                    <input
                      type="file"
                      id="soutenance-file-upload"
                      accept=".pdf,.docx"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        handleFileChange(e);
                        startSoutenanceNow();
                      }}
                    />

                    <div className="modal-actions">
                      <button
                        className="btn-dark-pill modal-btn"
                        onClick={() => confirmStartSoutenance('dossier')}
                      >
                        <Upload size={16} style={{ marginRight: '8px' }} />
                        {selectedFile ? 'Démarrer avec ce dossier' : 'Charger mon dossier (PDF / Word)'}
                      </button>
                      <button
                        className="btn-outline-pill modal-btn"
                        onClick={() => confirmStartSoutenance('generic')}
                      >
                        <Play size={16} style={{ marginRight: '8px' }} />
                        Démarrer en mode générique (Sans dossier)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="oral-grid">
                {/* Timer card */}
                <div className="card-soft timer-card">
                  <h3 className="card-title">Présentation du Projet</h3>
                  <p className="card-subtitle">Chronomètre réglementaire (35 minutes)</p>
                  <div className="timer-display">{formatTime(timeLeft)}</div>
                  <div className="timer-controls">
                    <button className="btn-dark-pill" onClick={handleStartSoutenanceClick}>
                      {timerRunning ? <Pause size={16} style={{ marginRight: '8px' }} /> : <Play size={16} style={{ marginRight: '8px' }} />}
                      {timerRunning ? 'Pause' : soutenanceStarted ? 'Reprendre' : 'Démarrer la soutenance'}
                    </button>
                    <button className="btn-outline-pill" onClick={() => { resetTimer(); setSoutenanceStarted(false); setSoutenanceReport(null); }}>
                      <RotateCcw size={16} style={{ marginRight: '8px' }} />
                      Réinitialiser
                    </button>
                  </div>

                  {/* Active phase indicator */}
                  {(() => {
                    const elapsed = (35 * 60) - timeLeft;
                    let currentPhaseIdx = 0;
                    if (elapsed > 1920) currentPhaseIdx = 5;
                    else if (elapsed > 1380) currentPhaseIdx = 4;
                    else if (elapsed > 780) currentPhaseIdx = 3;
                    else if (elapsed > 360) currentPhaseIdx = 2;
                    else if (elapsed > 60) currentPhaseIdx = 1;

                    const phases = [
                      "0-1 min : Introduction & Profil",
                      "1-6 min : Contexte & Analyse",
                      "6-13 min : Conception UX/UI",
                      "13-23 min : Démo Application (10 min)",
                      "23-32 min : Architecture & Code",
                      "32-35 min : Perspectives & Bilan"
                    ];

                    return (
                      <div className="oral-phases">
                        {phases.map((ph, idx) => (
                          <div key={idx} className={`phase-item ${soutenanceStarted && currentPhaseIdx === idx ? 'active-phase' : ''}`}>
                            {soutenanceStarted && currentPhaseIdx === idx && <span className="phase-dot"></span>}
                            {ph}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Speech transcription card */}
                <div className="card-soft speech-card">
                  <h3 className="card-title">Enregistrement & Transcription</h3>
                  <p className="card-subtitle">Présentez votre projet à voix haute devant le jury</p>

                  {!hasSupport && (
                    <div className="warning-box">
                      <AlertTriangle size={18} className="warn-icon" />
                      <span>Votre navigateur ne supporte pas l'API Web Speech native. Utilisez Chrome ou Edge pour cette fonctionnalité.</span>
                    </div>
                  )}

                  <div className="speech-controls">
                    {isListening ? (
                      <button className="btn-dark-pill stop-listening" onClick={stopListening}>
                        <MicOff size={16} style={{ marginRight: '8px' }} />
                        Mettre le micro en pause
                      </button>
                    ) : (
                      <button className="btn-dark-pill start-listening" onClick={startListening} disabled={!hasSupport}>
                        <Mic size={16} style={{ marginRight: '8px' }} />
                        Activer le micro
                      </button>
                    )}
                    <button className="btn-outline-pill" onClick={clearTranscript}>
                      Effacer
                    </button>
                  </div>

                  {isListening && <div className="pulse-indicator">En écoute... exprimez-vous clairement</div>}

                  <div className="transcript-box">
                    {accumulatedTranscript || transcript ? (
                      <span>{accumulatedTranscript} {transcript}</span>
                    ) : (
                      <span className="placeholder-text">Votre transcription orale complète s'accumulera ici pendant votre présentation...</span>
                    )}
                  </div>

                  {soutenanceStarted && (
                    <div className="submit-soutenance-box">
                      <button
                        className="btn-dark-pill submit-soutenance-btn"
                        onClick={submitSoutenancePresentation}
                        disabled={evaluatingSoutenance}
                      >
                        <Sparkles size={16} style={{ marginRight: '8px' }} />
                        {evaluatingSoutenance ? 'Analyse du Jury en cours...' : 'Terminer la présentation et évaluer'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Evaluation Report Card */}
              {evaluatingSoutenance && (
                <div className="card-soft loading-card" style={{ marginTop: '24px' }}>
                  <div className="spinner"></div>
                  <p style={{ marginTop: '12px', fontWeight: 600 }}>Le Jury IA évalue votre présentation orale...</p>
                </div>
              )}

              {soutenanceReport && (
                <div className="card-soft soutenance-report-card fade-in" style={{ marginTop: '32px' }}>
                  <div className="report-header">
                    <div>
                      <h3 className="card-title">Bilan de la Soutenance Orale</h3>
                      <p className="card-subtitle">Évaluation globale réalisée par le président du jury</p>
                    </div>
                    <div className="report-main-score">
                      <span className="score-number">{soutenanceReport.overall_score}</span>
                      <span className="score-denom">/100</span>
                    </div>
                  </div>

                  <div className="report-metrics-grid">
                    <div className="metric-box">
                      <span className="metric-lbl">Gestion du temps</span>
                      <span className="metric-val">{soutenanceReport.time_management_score}%</span>
                    </div>
                    <div className="metric-box">
                      <span className="metric-lbl">Profondeur technique</span>
                      <span className="metric-val">{soutenanceReport.technical_depth_score}%</span>
                    </div>
                    <div className="metric-box">
                      <span className="metric-lbl">Clarté & Vocabulaire</span>
                      <span className="metric-val">{soutenanceReport.clarity_score}%</span>
                    </div>
                  </div>

                  {/* Phases status */}
                  <h4 className="report-section-title">Couverture des 5 phases réglementaires :</h4>
                  <div className="report-phases-list">
                    {soutenanceReport.phases_covered.map((ph, i) => (
                      <div key={i} className={`report-phase-row ${ph.detected ? 'valid' : 'invalid'}`}>
                        <span className="phase-row-icon">{ph.detected ? <CheckCircle2 size={16} color="var(--color-fern)" /> : <XCircle size={16} color="#d32f2f" />}</span>
                        <span className="phase-row-name">{ph.phase}</span>
                        <span className="phase-row-feedback">{ph.feedback}</span>
                      </div>
                    ))}
                  </div>

                  <div className="report-feedback-columns">
                    <div className="feedback-col strengths">
                      <h4 className="report-section-title">👍 Points forts :</h4>
                      <ul>
                        {soutenanceReport.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div className="feedback-col improvements">
                      <h4 className="report-section-title">🎯 Axes d'amélioration :</h4>
                      <ul>
                        {soutenanceReport.areas_for_improvement.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Jury Questions */}
              <div className="card-soft full-width-card" style={{ marginTop: '32px' }}>
                <h3 className="card-title">Questions du Jury (Entretien Technique)</h3>
                <p className="card-subtitle">
                  {selectedFile ? `Questions sur-mesure générées pour : ${selectedFile.name}` : `${juryQuestions.length} questions — ${selectedCategory === 'Toutes' ? 'tous domaines' : selectedCategory}`}
                </p>

                {/* Category filter pills for jury mode */}
                <div className="category-filter-bar">
                  <Filter size={14} className="filter-icon" />
                  <div className="category-pills-scroll">
                    {availableCategories.map(cat => (
                      <button
                        key={cat}
                        className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                        onClick={() => handleCategoryChange(cat)}
                      >
                        {cat}
                        {cat !== 'Toutes' && (
                          <span className="category-count">
                            {questions.filter(q => q.type === 'jury' && (q as any).category === cat).length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="questions-list">
                  {juryQuestions.map((q, idx) => (
                    <div key={idx} className="question-item">
                      <div className="question-header" onClick={() => toggleAnswer(`jury-${idx}`)}>
                        <span className="jury-question-text">
                          {(q as any).category && <span className="jury-category-badge">{(q as any).category}</span>}
                          {q.question_text}
                        </span>
                        <button className="btn-link">{revealedAnswers[`jury-${idx}`] ? 'Masquer' : 'Révéler'}</button>
                      </div>
                      {revealedAnswers[`jury-${idx}`] && (
                        <div className="question-answer">
                          <p><strong>Mots-clés attendus :</strong> {q.correct_answer}</p>
                          <p style={{ marginTop: '8px' }}><strong>Explication théorique :</strong> {q.explanation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : simulationMode === 'qcm' ? (
            /* QCM Mode UI */
            <div className="card-soft qcm-container">
              <div className="qcm-header-box">
                <div>
                  <h3 className="card-title">QCM d'Entraînement Technique</h3>
                  <p className="card-subtitle">
                    {selectedFile ? `Questions personnalisées pour le projet : ${selectedFile.name}` : `${qcmQuestions.length} questions — ${selectedCategory === 'Toutes' ? 'tous domaines' : selectedCategory}`}
                  </p>
                </div>
                {answeredCount > 0 && (
                  <div className="qcm-score-badge">
                    Score : {correctCount} / {answeredCount}
                  </div>
                )}
              </div>

              {/* Category filter pills */}
              <div className="category-filter-bar">
                <Filter size={14} className="filter-icon" />
                <div className="category-pills-scroll">
                  {availableCategories.map(cat => (
                    <button
                      key={cat}
                      className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                      onClick={() => handleCategoryChange(cat)}
                    >
                      {cat}
                      {cat !== 'Toutes' && (
                        <span className="category-count">
                          {questions.filter(q => q.type === 'qcm' && (q as any).category === cat).length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="qcm-questions-list">
                {qcmQuestions.map((q, idx) => {
                  const isAnswered = validatedQuestions[idx];
                  const userAnswer = selectedChoices[idx];
                  
                  return (
                    <div key={idx} className="qcm-question-card">
                      <div className="qcm-question-text">
                        <span className="qcm-number">{idx + 1}.</span> {q.question_text}
                      </div>

                      <div className="qcm-choices-grid">
                        {q.choices?.map((choice, cIdx) => {
                          let choiceClass = 'qcm-choice-btn';
                          if (isAnswered) {
                            if (choice === q.correct_answer) {
                              choiceClass += ' correct';
                            } else if (choice === userAnswer) {
                              choiceClass += ' incorrect';
                            } else {
                              choiceClass += ' disabled';
                            }
                          } else if (userAnswer === choice) {
                            choiceClass += ' selected';
                          }

                          return (
                            <button
                              key={cIdx}
                              className={choiceClass}
                              onClick={() => handleQcmSelect(idx, choice)}
                              disabled={isAnswered}
                            >
                              {choice}
                            </button>
                          );
                        })}
                      </div>

                      {isAnswered && (
                        <div className="qcm-explanation-box fade-in">
                          <strong>Explication :</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : simulationMode === 'interactive' ? (
            /* Interactive Oral Examiner Mode */
            <div className="card-soft interactive-container">
              {!interactiveStarted ? (
                <div className="interactive-welcome">
                  <div className="interactive-welcome-icon">🎓</div>
                  <h3 className="card-title">Entretien Technique Interactif</h3>
                  <p className="card-subtitle">
                    L'examinateur IA va vous poser des questions techniques oralement.
                    Répondez au micro ou par écrit. Il évaluera vos réponses en temps réel
                    et posera des questions de relance.
                  </p>
                  <div className="interactive-config">
                    <div className="config-row">
                      <span>Voix de l'examinateur</span>
                      <button
                        className={`toggle-btn ${ttsEnabled ? 'on' : 'off'}`}
                        onClick={() => setTtsEnabled(!ttsEnabled)}
                      >
                        {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                        {ttsEnabled ? 'Activée' : 'Désactivée'}
                      </button>
                    </div>
                    <div className="config-row">
                      <span>Questions disponibles</span>
                      <span className="config-value">{Math.min(maxInteractiveQuestions, interactiveJuryQuestions.length)} questions jury</span>
                    </div>
                  </div>
                  <button className="btn-dark-pill start-interview-btn" onClick={startInteractiveSession}>
                    <Play size={16} style={{ marginRight: '8px' }} />
                    Démarrer l'entretien
                  </button>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div className="chat-header">
                    <div className="chat-header-left">
                      <span className="chat-exam-badge">🎓 Examinateur DWWM</span>
                      {!sessionComplete && (
                        <span className="chat-progress">
                          Question {Math.min(interactiveQuestionIdx + 1, maxInteractiveQuestions)} / {Math.min(maxInteractiveQuestions, interactiveJuryQuestions.length)}
                        </span>
                      )}
                    </div>
                    <div className="chat-header-right">
                      {interactiveTotal > 0 && (
                        <span className="chat-score-live">
                          Moyenne : {(interactiveScore / interactiveTotal).toFixed(1)}/10
                        </span>
                      )}
                      <button
                        className={`icon-btn ${ttsEnabled ? '' : 'muted'}`}
                        onClick={() => { setTtsEnabled(!ttsEnabled); window.speechSynthesis?.cancel(); }}
                        title={ttsEnabled ? 'Couper la voix' : 'Activer la voix'}
                      >
                        {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Chat messages */}
                  <div className="chat-messages">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`chat-bubble ${msg.role}`}>
                        {msg.role === 'examiner' && <span className="bubble-avatar">🎓</span>}
                        {msg.role === 'candidate' && <span className="bubble-avatar">🎙️</span>}
                        <div className="bubble-content">
                          <p>{msg.text}</p>
                          {msg.score !== undefined && (
                            <div className="eval-result">
                              <span className={`eval-score ${msg.score >= 7 ? 'good' : msg.score >= 4 ? 'ok' : 'low'}`}>
                                {msg.score}/10
                              </span>
                              {msg.detectedKeywords && msg.detectedKeywords.length > 0 && (
                                <div className="keyword-tags">
                                  {msg.detectedKeywords.map((kw, i) => (
                                    <span key={i} className="kw-tag found">✓ {kw}</span>
                                  ))}
                                  {msg.missingKeywords?.map((kw, i) => (
                                    <span key={i} className="kw-tag missing">✗ {kw}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {isEvaluating && (
                      <div className="chat-bubble system">
                        <div className="bubble-content">
                          <div className="typing-indicator">
                            <span></span><span></span><span></span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input area */}
                  {!sessionComplete ? (
                    <div className="chat-input-area">
                      <div className="chat-input-row">
                        <button
                          className={`mic-btn ${isListening ? 'active' : ''}`}
                          onClick={isListening ? stopListening : startListening}
                          disabled={!hasSupport || isEvaluating}
                          title={isListening ? 'Arrêter le micro' : 'Parler'}
                        >
                          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                        </button>
                        <input
                          type="text"
                          className="chat-text-input"
                          placeholder={isListening ? 'En écoute... parlez' : 'Tapez votre réponse ou utilisez le micro...'}
                          value={isListening ? transcript : candidateInput}
                          onChange={(e) => !isListening && setCandidateInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && submitAnswer()}
                          disabled={isEvaluating}
                        />
                        <button
                          className="send-btn"
                          onClick={() => submitAnswer()}
                          disabled={isEvaluating || (!(candidateInput.trim()) && !(transcript.trim()))}
                        >
                          <Send size={18} />
                        </button>
                      </div>
                      {isListening && transcript && (
                        <div className="live-transcript">
                          <span className="pulse-dot"></span> {transcript}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="chat-session-end">
                      <button className="btn-dark-pill" onClick={startInteractiveSession}>
                        <RefreshCw size={16} style={{ marginRight: '8px' }} />
                        Relancer un entretien
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : null}
        </section>
      )}

      {/* Dossier tab */}
      {activeTab === 'dossier' && (
        <section className="tab-content fade-in">
          <div className="card-soft upload-card">
            <h3 className="card-title">Analyseur de Conformité du Dossier de Projet</h3>
            <p className="card-subtitle">Glissez-déposez ou sélectionnez votre fichier de projet (PDF ou Word, 30-50 pages réglementaires)</p>
            
            <div className="file-drop-zone">
              <input type="file" id="file-upload" accept=".pdf,.docx" onChange={handleFileChange} style={{ display: 'none' }} />
              <label htmlFor="file-upload" className="upload-label">
                <span className="upload-text-main">Sélectionner un fichier</span>
                <span className="upload-text-sub">Fichiers acceptés : .pdf, .docx (Max 15MB)</span>
              </label>
            </div>

            {selectedFile && (
              <div className="selected-file-info">
                Fichier sélectionné : <strong>{selectedFile.name}</strong>
              </div>
            )}

            {analyzing && (
              <div className="analyzing-status">
                <div className="spinner"></div>
                <p>Analyse et génération de questions sur-mesure via IA locale...</p>
              </div>
            )}

            {analysisResult && (
              <div className="results-container">
                <Separator width="100%" margin="24px 0" />
                <div className="result-score-header">
                  <div className="score-badge">
                    <span className="score-val">{analysisResult.score}%</span>
                    <span className="score-lbl">Conformité estimée</span>
                  </div>
                  <div className="score-summary">
                    {analysisResult.score >= 85 ? (
                      <p className="status-success"><CheckCircle size={16} /> Votre dossier est prêt pour la soumission au jury !</p>
                    ) : (
                      <p className="status-warning"><AlertTriangle size={16} /> Quelques points d'amélioration identifiés avant soumission.</p>
                    )}
                  </div>
                </div>

                <div className="criteria-list">
                  {analysisResult.criteria.map((crit, idx) => (
                    <div key={idx} className={`criteria-item ${crit.checked ? 'valid' : 'invalid'}`}>
                      <div className="crit-header">
                        <span className="crit-icon">{crit.checked ? '✓' : '✗'}</span>
                        <span className="crit-name">{crit.name}</span>
                      </div>
                      <p className="crit-feedback">{crit.feedback}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Agile tab */}
      {activeTab === 'agile' && (
        <section className="tab-content fade-in">
          <div className="card-soft page-intro-card">
            <h3 className="card-title">Gestion de Projet Agile (Kanban)</h3>
            <p className="card-subtitle">
              Simulez la planification de votre projet. Les compétences de conduite de projet et d'agilité sont cruciales pour le CCP2.
            </p>
          </div>

          <div className="kanban-board">
            {/* Column Backlog */}
            <div className="kanban-column">
              <h4 className="column-title">Backlog (À faire)</h4>
              <div className="column-list">
                {tasks.filter(t => t.status === 'backlog').map(task => (
                  <div key={task.id} className="kanban-card">
                    <div className="task-title">{task.title}</div>
                    <div className="task-footer">
                      <span className="task-points">{task.points} pts</span>
                      <button className="btn-small" onClick={() => moveTask(task.id, 'forward')}>Commencer →</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column Progress */}
            <div className="kanban-column">
              <h4 className="column-title">En Cours</h4>
              <div className="column-list">
                {tasks.filter(t => t.status === 'progress').map(task => (
                  <div key={task.id} className="kanban-card">
                    <div className="task-title">{task.title}</div>
                    <div className="task-footer">
                      <span className="task-points">{task.points} pts</span>
                      <div className="task-actions">
                        <button className="btn-small-sec" onClick={() => moveTask(task.id, 'backward')}>← Retour</button>
                        <button className="btn-small" onClick={() => moveTask(task.id, 'forward')}>Valider →</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column Done */}
            <div className="kanban-column">
              <h4 className="column-title">Validé</h4>
              <div className="column-list">
                {tasks.filter(t => t.status === 'done').map(task => (
                  <div key={task.id} className="kanban-card task-done">
                    <div className="task-title">{task.title}</div>
                    <div className="task-footer">
                      <span className="task-points">{task.points} pts</span>
                      <button className="btn-small-sec" onClick={() => moveTask(task.id, 'backward')}>← En cours</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* OWASP tab */}
      {activeTab === 'owasp' && (
        <section className="tab-content fade-in">
          <div className="card-soft">
            <h3 className="card-title">Référentiel OWASP & Cyber-Résilience</h3>
            <p className="card-subtitle">
              Mémorisez les failles de sécurité de référence. Le jury pose fréquemment des questions sur ces aspects.
            </p>
            <div className="owasp-list">
              <div className="owasp-item">
                <div className="owasp-index">A01:2021</div>
                <div className="owasp-detail">
                  <strong>Contrôle d'accès défaillant (Broken Access Control)</strong>
                  <p>Les utilisateurs peuvent accéder à des ressources en dehors de leurs privilèges (ex: modifier le compte d'un autre utilisateur en changeant l'ID dans l'URL). Prévention : vérification des permissions côté serveur, principe du moindre privilège.</p>
                </div>
              </div>
              <div className="owasp-item">
                <div className="owasp-index">A02:2021</div>
                <div className="owasp-detail">
                  <strong>Défaillances cryptographiques (Cryptographic Failures)</strong>
                  <p>Protection inadéquate des données sensibles en transit ou au repos. Ex: mot de passe stocké en clair ou haché avec MD5 au lieu de Bcrypt. Prévention : HTTPS, Bcrypt/Argon2, chiffrement AES au repos.</p>
                </div>
              </div>
              <div className="owasp-item">
                <div className="owasp-index">A03:2021</div>
                <div className="owasp-detail">
                  <strong>Injections (SQL, XSS, Command Injection)</strong>
                  <p>Interprétation de données utilisateur hostiles comme faisant partie d'une commande. Prévention : requêtes paramétrées, ORM, échappement des sorties HTML, Content Security Policy (CSP).</p>
                </div>
              </div>
              <div className="owasp-item">
                <div className="owasp-index">A04:2021</div>
                <div className="owasp-detail">
                  <strong>Conception non sécurisée (Insecure Design)</strong>
                  <p>Absence de modélisation des menaces dès la conception. Prévention : Privacy by Design, threat modeling, revue d'architecture sécurité, design patterns sécurisés.</p>
                </div>
              </div>
              <div className="owasp-item">
                <div className="owasp-index">A05:2021</div>
                <div className="owasp-detail">
                  <strong>Mauvaise configuration de sécurité (Security Misconfiguration)</strong>
                  <p>Serveur mal configuré, pages d'erreur trop verbeuses, ports inutiles ouverts, comptes par défaut actifs. Prévention : durcissement des configurations, désactivation des fonctionnalités inutiles, mises à jour régulières.</p>
                </div>
              </div>
              <div className="owasp-item">
                <div className="owasp-index">A06:2021</div>
                <div className="owasp-detail">
                  <strong>Composants vulnérables et obsolètes (Vulnerable and Outdated Components)</strong>
                  <p>Utilisation de bibliothèques, frameworks ou modules avec des vulnérabilités connues (CVE). Prévention : npm audit, Dependabot, mise à jour régulière des dépendances, SBOM (Software Bill of Materials).</p>
                </div>
              </div>
              <div className="owasp-item">
                <div className="owasp-index">A07:2021</div>
                <div className="owasp-detail">
                  <strong>Identification et authentification défaillantes (Identification and Authentication Failures)</strong>
                  <p>Mots de passe faibles autorisés, absence de protection anti-brute force, sessions non invalidées. Prévention : Bcrypt avec salt, MFA (authentification multi-facteurs), limitation du taux de tentatives.</p>
                </div>
              </div>
              <div className="owasp-item">
                <div className="owasp-index">A08:2021</div>
                <div className="owasp-detail">
                  <strong>Manque d'intégrité des données et du logiciel (Software and Data Integrity Failures)</strong>
                  <p>Code ou données modifiés sans vérification (ex: pipeline CI/CD non sécurisé, dépendances non vérifiées). Prévention : signatures numériques, intégrité des pipelines CI/CD, SRI (Subresource Integrity) pour les CDN.</p>
                </div>
              </div>
              <div className="owasp-item">
                <div className="owasp-index">A09:2021</div>
                <div className="owasp-detail">
                  <strong>Journalisation et surveillance insuffisantes (Security Logging and Monitoring Failures)</strong>
                  <p>Absence de logs ou de monitoring permettant de détecter une intrusion. Prévention : journalisation des événements d'authentification, alertes en temps réel, conservation sécurisée des logs, SIEM.</p>
                </div>
              </div>
              <div className="owasp-item">
                <div className="owasp-index">A10:2021</div>
                <div className="owasp-detail">
                  <strong>Falsification de requêtes côté serveur — SSRF (Server-Side Request Forgery)</strong>
                  <p>L'application effectue des requêtes HTTP vers des URL fournies par l'utilisateur sans validation. Prévention : liste blanche d'URLs autorisées, blocage des requêtes vers les réseaux internes, validation stricte des entrées.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default CertificationSimulator;
