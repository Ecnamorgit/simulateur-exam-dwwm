import React, { useEffect, useRef } from 'react';
import { Play, Send } from 'lucide-react';
import { useEntretienFinal } from '../../hooks/useEntretienFinal';
import { useExamTimer, formatTime } from '../../hooks/useExamTimer';

interface Props {
  speak: (text: string) => void;
  onBack: () => void;
  onComplete?: (score: number) => void;
}

const DURATION = 15 * 60;

/** Épreuve « Entretien final » (15 min) : échange non technique sur le profil pro. */
const EntretienFinal: React.FC<Props> = ({ speak, onBack, onComplete }) => {
  const ef = useEntretienFinal(speak);
  const timer = useExamTimer(DURATION);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    if (ef.started && !ef.complete) { timer.resetTimer(DURATION); timer.setTimerRunning(true); }
    /* eslint-disable-next-line */
  }, [ef.started]);

  useEffect(() => {
    if (timer.timeLeft === 0 && ef.started && !ef.complete) {
      timer.setTimerRunning(false);
      ef.finish(ef.scoreSum, ef.answered);
    }
    /* eslint-disable-next-line */
  }, [timer.timeLeft]);

  useEffect(() => {
    if (ef.complete) {
      timer.setTimerRunning(false);
      if (onComplete && !completedRef.current) {
        completedRef.current = true;
        const avg10 = ef.answered > 0 ? ef.scoreSum / ef.answered : 0;
        onComplete(Math.round(avg10 * 10));
      }
    }
    /* eslint-disable-next-line */
  }, [ef.complete]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [ef.messages]);

  return (
    <section className="tab-content fade-in">
      <div className="card-soft page-intro-card entretien-head">
        <div className="entretien-head-row">
          <button className="btn-outline-pill" onClick={onBack}>← Retour au déroulé</button>
          {ef.started && (
            <span className={`epreuve-timer ${timer.timeLeft <= 60 && !ef.complete ? 'urgent' : ''}`}>
              ⏱ {formatTime(timer.timeLeft)}
            </span>
          )}
        </div>
        <h3 className="card-title">Entretien final (15 min)</h3>
        <p className="card-subtitle">
          Échange sur la compréhension du métier, votre posture professionnelle, votre parcours,
          votre Dossier Professionnel et votre motivation. Aucune question technique.
        </p>
      </div>

      <div className="card-soft interactive-container">
        {!ef.started ? (
          <div className="interactive-welcome">
            <div className="interactive-welcome-icon">🤝</div>
            <h3 className="card-title">Prêt·e pour l'entretien final ?</h3>
            <p className="card-subtitle">
              Le jury va vous poser {6} questions orientées métier et savoir-être. Répondez avec sincérité et clarté.
            </p>
            <button className="btn-dark-pill start-interview-btn" onClick={ef.start}>
              <Play size={16} style={{ marginRight: '8px' }} />
              Démarrer l'entretien final
            </button>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <div className="chat-header-left">
                <span className="chat-exam-badge">🤝 Jury — Entretien final</span>
                {!ef.complete && <span className="chat-progress">Question {Math.min(ef.idx + 1, ef.questions.length)} / {ef.questions.length}</span>}
              </div>
              <div className="chat-header-right">
                {ef.answered > 0 && <span className="chat-score-live">Savoir-être : {(ef.scoreSum / ef.answered).toFixed(1)}/10</span>}
              </div>
            </div>

            <div className="chat-messages">
              {ef.messages.map((msg, i) => (
                <div key={i} className={`chat-bubble ${msg.role}`}>
                  {msg.role === 'examiner' && <span className="bubble-avatar">🤝</span>}
                  {msg.role === 'candidate' && <span className="bubble-avatar">🙋</span>}
                  <div className="bubble-content">
                    <p>{msg.text}</p>
                    {msg.score !== undefined && (
                      <div className="eval-result">
                        <span className={`eval-score ${msg.score >= 7 ? 'good' : msg.score >= 4 ? 'ok' : 'low'}`}>{msg.score}/10</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {ef.isEvaluating && (
                <div className="chat-bubble system">
                  <div className="bubble-content"><div className="typing-indicator"><span></span><span></span><span></span></div></div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {!ef.complete && (
              <div className="chat-input-area">
                <div className="chat-input-row">
                  <input
                    type="text"
                    className="chat-text-input"
                    aria-label="Votre réponse"
                    placeholder="Votre réponse..."
                    value={ef.input}
                    onChange={(e) => ef.setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && ef.submit()}
                    disabled={ef.isEvaluating}
                  />
                  <button className="send-btn" onClick={ef.submit} disabled={ef.isEvaluating || !ef.input.trim()}>
                    <Send size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default EntretienFinal;
