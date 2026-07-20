import React from 'react';
import {
  Play, Pause, RotateCcw, Mic, MicOff, AlertTriangle, Filter,
  CheckCircle2, XCircle, Sparkles,
} from 'lucide-react';
import SoutenanceModal from './SoutenanceModal';
import { formatTime } from '../../hooks/useExamTimer';
import { Question, SoutenanceReport } from '../../types/exam';

interface Props {
  // Soutenance state & actions
  showSoutenanceModal: boolean;
  setShowSoutenanceModal: (b: boolean) => void;
  soutenanceStarted: boolean;
  evaluatingSoutenance: boolean;
  soutenanceReport: SoutenanceReport | null;
  accumulatedTranscript: string;
  manualTranscript: string;
  setManualTranscript: (v: string) => void;
  handleStartSoutenanceClick: () => void;
  confirmStartSoutenance: (mode: 'dossier' | 'generic') => void;
  submitSoutenancePresentation: () => void;
  resetSoutenance: () => void;
  startSoutenanceNow: () => void;
  // Timer
  timeLeft: number;
  timerRunning: boolean;
  // Speech
  transcript: string;
  isListening: boolean;
  hasSupport: boolean;
  startListening: () => void;
  stopListening: () => void;
  clearTranscript: () => void;
  // Dossier
  selectedFile: File | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // Jury questions
  questions: Question[];
  juryQuestions: Question[];
  selectedCategory: string;
  availableCategories: string[];
  onCategoryChange: (cat: string) => void;
  revealedAnswers: { [key: string]: boolean };
  toggleAnswer: (key: string) => void;
}

const PHASES = [
  '0-1 min : Introduction & Profil',
  '1-6 min : Contexte & Analyse',
  '6-13 min : Conception UX/UI',
  '13-23 min : Démo Application (10 min)',
  '23-32 min : Architecture & Code',
  '32-35 min : Perspectives & Bilan',
];

/** Mode « Jury » : soutenance chronométrée 35 min + bilan + questions du jury. */
const JuryMode: React.FC<Props> = (p) => {
  const elapsed = (35 * 60) - p.timeLeft;
  let currentPhaseIdx = 0;
  if (elapsed > 1920) currentPhaseIdx = 5;
  else if (elapsed > 1380) currentPhaseIdx = 4;
  else if (elapsed > 780) currentPhaseIdx = 3;
  else if (elapsed > 360) currentPhaseIdx = 2;
  else if (elapsed > 60) currentPhaseIdx = 1;

  return (
    <>
      {p.showSoutenanceModal && (
        <SoutenanceModal
          selectedFile={p.selectedFile}
          onClose={() => p.setShowSoutenanceModal(false)}
          onConfirm={p.confirmStartSoutenance}
          onFileSelected={(e) => { p.handleFileChange(e); p.startSoutenanceNow(); }}
        />
      )}

      <div className="oral-grid">
        {/* Timer card */}
        <div className="card-soft timer-card">
          <h3 className="card-title">Présentation du Projet</h3>
          <p className="card-subtitle">Chronomètre réglementaire (35 minutes)</p>
          <div className="timer-display">{formatTime(p.timeLeft)}</div>
          <div className="timer-controls">
            <button className="btn-dark-pill" onClick={p.handleStartSoutenanceClick}>
              {p.timerRunning ? <Pause size={16} style={{ marginRight: '8px' }} /> : <Play size={16} style={{ marginRight: '8px' }} />}
              {p.timerRunning ? 'Pause' : p.soutenanceStarted ? 'Reprendre' : 'Démarrer la soutenance'}
            </button>
            <button className="btn-outline-pill" onClick={p.resetSoutenance}>
              <RotateCcw size={16} style={{ marginRight: '8px' }} />
              Réinitialiser
            </button>
          </div>

          <div className="oral-phases">
            {PHASES.map((ph, idx) => (
              <div key={idx} className={`phase-item ${p.soutenanceStarted && currentPhaseIdx === idx ? 'active-phase' : ''}`}>
                {p.soutenanceStarted && currentPhaseIdx === idx && <span className="phase-dot"></span>}
                {ph}
              </div>
            ))}
          </div>
        </div>

        {/* Speech transcription card */}
        <div className="card-soft speech-card">
          <h3 className="card-title">Enregistrement & Transcription</h3>
          <p className="card-subtitle">Présentez votre projet à voix haute devant le jury</p>

          {!p.hasSupport && (
            <>
              <div className="warning-box">
                <AlertTriangle size={18} className="warn-icon" />
                <span>Votre navigateur ne supporte pas la reconnaissance vocale (Web Speech). Vous pouvez saisir votre présentation au clavier ci-dessous.</span>
              </div>
              <textarea
                className="open-answer-input"
                aria-label="Texte de votre présentation"
                placeholder="Saisissez le texte de votre présentation ici..."
                value={p.manualTranscript}
                onChange={(e) => p.setManualTranscript(e.target.value)}
                rows={5}
              />
            </>
          )}

          <div className="speech-controls">
            {p.isListening ? (
              <button className="btn-dark-pill stop-listening" onClick={p.stopListening}>
                <MicOff size={16} style={{ marginRight: '8px' }} />
                Mettre le micro en pause
              </button>
            ) : (
              <button className="btn-dark-pill start-listening" onClick={p.startListening} disabled={!p.hasSupport}>
                <Mic size={16} style={{ marginRight: '8px' }} />
                Activer le micro
              </button>
            )}
            <button className="btn-outline-pill" onClick={p.clearTranscript}>
              Effacer
            </button>
          </div>

          {p.isListening && <div className="pulse-indicator">En écoute... exprimez-vous clairement</div>}

          <div className="transcript-box">
            {p.accumulatedTranscript || p.transcript ? (
              <span>{p.accumulatedTranscript} {p.transcript}</span>
            ) : (
              <span className="placeholder-text">Votre transcription orale complète s'accumulera ici pendant votre présentation...</span>
            )}
          </div>

          {p.soutenanceStarted && (
            <div className="submit-soutenance-box">
              <button
                className="btn-dark-pill submit-soutenance-btn"
                onClick={p.submitSoutenancePresentation}
                disabled={p.evaluatingSoutenance}
              >
                <Sparkles size={16} style={{ marginRight: '8px' }} />
                {p.evaluatingSoutenance ? 'Analyse du Jury en cours...' : 'Terminer la présentation et évaluer'}
              </button>
            </div>
          )}
        </div>
      </div>

      {p.evaluatingSoutenance && (
        <div className="card-soft loading-card" style={{ marginTop: '24px' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '12px', fontWeight: 600 }}>Le Jury IA évalue votre présentation orale...</p>
        </div>
      )}

      {p.soutenanceReport && (
        <div className="card-soft soutenance-report-card fade-in" style={{ marginTop: '32px' }}>
          <div className="report-header">
            <div>
              <h3 className="card-title">Bilan de la Soutenance Orale</h3>
              <p className="card-subtitle">Évaluation globale réalisée par le président du jury</p>
            </div>
            <div className="report-main-score">
              <span className="score-number">{p.soutenanceReport.overall_score}</span>
              <span className="score-denom">/100</span>
            </div>
          </div>

          <div className="report-metrics-grid">
            <div className="metric-box">
              <span className="metric-lbl">Gestion du temps</span>
              <span className="metric-val">{p.soutenanceReport.time_management_score}%</span>
            </div>
            <div className="metric-box">
              <span className="metric-lbl">Profondeur technique</span>
              <span className="metric-val">{p.soutenanceReport.technical_depth_score}%</span>
            </div>
            <div className="metric-box">
              <span className="metric-lbl">Clarté & Vocabulaire</span>
              <span className="metric-val">{p.soutenanceReport.clarity_score}%</span>
            </div>
          </div>

          <h4 className="report-section-title">Couverture des 5 phases réglementaires :</h4>
          <div className="report-phases-list">
            {p.soutenanceReport.phases_covered.map((ph, i) => (
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
                {p.soutenanceReport.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div className="feedback-col improvements">
              <h4 className="report-section-title">🎯 Axes d'amélioration :</h4>
              <ul>
                {p.soutenanceReport.areas_for_improvement.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Jury Questions */}
      <div className="card-soft full-width-card" style={{ marginTop: '32px' }}>
        <h3 className="card-title">Questions du Jury (Entretien Technique)</h3>
        <p className="card-subtitle">
          {p.selectedFile ? `Questions sur-mesure générées pour : ${p.selectedFile.name}` : `${p.juryQuestions.length} questions — ${p.selectedCategory === 'Toutes' ? 'tous domaines' : p.selectedCategory}`}
        </p>

        <div className="category-filter-bar">
          <Filter size={14} className="filter-icon" />
          <div className="category-pills-scroll">
            {p.availableCategories.map((cat) => (
              <button
                key={cat}
                className={`category-pill ${p.selectedCategory === cat ? 'active' : ''}`}
                onClick={() => p.onCategoryChange(cat)}
              >
                {cat}
                {cat !== 'Toutes' && (
                  <span className="category-count">
                    {p.questions.filter((q) => q.type === 'jury' && (q as any).category === cat).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="questions-list">
          {p.juryQuestions.map((q, idx) => (
            <div key={idx} className="question-item">
              <div className="question-header" onClick={() => p.toggleAnswer(`jury-${idx}`)}>
                <span className="jury-question-text">
                  {(q as any).category && <span className="jury-category-badge">{(q as any).category}</span>}
                  {q.question_text}
                </span>
                <button className="btn-link">{p.revealedAnswers[`jury-${idx}`] ? 'Masquer' : 'Révéler'}</button>
              </div>
              {p.revealedAnswers[`jury-${idx}`] && (
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
  );
};

export default JuryMode;
