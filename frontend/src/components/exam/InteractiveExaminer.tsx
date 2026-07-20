import React from 'react';
import { Play, Mic, MicOff, Volume2, VolumeX, Send, RefreshCw } from 'lucide-react';
import { ChatMessage, Question } from '../../types/exam';

interface Props {
  interactiveStarted: boolean;
  chatMessages: ChatMessage[];
  interactiveQuestionIdx: number;
  interactiveScore: number;
  interactiveTotal: number;
  isEvaluating: boolean;
  candidateInput: string;
  setCandidateInput: (v: string) => void;
  sessionComplete: boolean;
  chatEndRef: React.RefObject<HTMLDivElement>;
  maxInteractiveQuestions: number;
  interactiveJuryQuestions: Question[];
  startInteractiveSession: () => void;
  submitAnswer: (answerText?: string) => void;
  ttsEnabled: boolean;
  setTtsEnabled: (v: boolean) => void;
  hasSupport: boolean;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  transcript: string;
}

/** Mode « Entretien IA » : examinateur interactif avec évaluation en temps réel. */
const InteractiveExaminer: React.FC<Props> = ({
  interactiveStarted, chatMessages, interactiveQuestionIdx, interactiveScore, interactiveTotal,
  isEvaluating, candidateInput, setCandidateInput, sessionComplete, chatEndRef, maxInteractiveQuestions,
  interactiveJuryQuestions, startInteractiveSession, submitAnswer, ttsEnabled, setTtsEnabled,
  hasSupport, isListening, startListening, stopListening, transcript,
}) => (
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
            <button className={`toggle-btn ${ttsEnabled ? 'on' : 'off'}`} onClick={() => setTtsEnabled(!ttsEnabled)}>
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
);

export default InteractiveExaminer;
