import React, { useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, RefreshCw, Sparkles } from 'lucide-react';
import { useQuestionnaire } from '../../hooks/useQuestionnaire';
import { useExamTimer, formatTime } from '../../hooks/useExamTimer';

interface Props {
  stack?: string;
  onBack: () => void;
  onComplete?: (score: number) => void;
}

const DURATION = 30 * 60;

/** Épreuve « Questionnaire professionnel » (30 min) : doc EN + 2 QCU FR + 2 ouvertes EN. */
const QuestionnairePro: React.FC<Props> = ({ stack = '', onBack, onComplete }) => {
  const q = useQuestionnaire();
  const timer = useExamTimer(DURATION);
  const completedRef = useRef(false);

  // Chargement initial du questionnaire.
  useEffect(() => { q.load(stack); /* eslint-disable-next-line */ }, []);

  // Démarre le chrono dès que le questionnaire est chargé.
  useEffect(() => {
    if (q.data && !q.result) { timer.resetTimer(DURATION); timer.setTimerRunning(true); }
    /* eslint-disable-next-line */
  }, [q.data]);

  // Soumission automatique quand le temps est écoulé.
  useEffect(() => {
    if (timer.timeLeft === 0 && q.data && !q.result && !q.submitting) {
      timer.setTimerRunning(false);
      q.submit();
    }
    /* eslint-disable-next-line */
  }, [timer.timeLeft]);

  useEffect(() => {
    if (q.result) {
      timer.setTimerRunning(false);
      if (onComplete && !completedRef.current) {
        completedRef.current = true;
        const closedPct = q.result.closed.total ? (q.result.closed.correct / q.result.closed.total) * 100 : 0;
        const openScores = q.result.open.flatMap((o) => [o.relevance_score, o.english_score]);
        const openPct = openScores.length ? (openScores.reduce((a, b) => a + b, 0) / openScores.length) * 10 : 0;
        onComplete(Math.round((closedPct + openPct) / 2));
      }
    }
    /* eslint-disable-next-line */
  }, [q.result]);

  return (
    <section className="tab-content fade-in">
      <div className="card-soft page-intro-card entretien-head">
        <div className="entretien-head-row">
          <button className="btn-outline-pill" onClick={onBack}>← Retour au déroulé</button>
          {q.data && (
            <span className={`epreuve-timer ${timer.timeLeft <= 60 && !q.result ? 'urgent' : ''}`}>
              ⏱ {formatTime(timer.timeLeft)}
            </span>
          )}
        </div>
        <h3 className="card-title">Questionnaire professionnel (30 min)</h3>
        <p className="card-subtitle">
          Étudiez la documentation technique en anglais, puis répondez : 2 questions fermées en français
          et 2 questions ouvertes en anglais (réponse rédigée en anglais).
        </p>
      </div>

      {q.loading && (
        <div className="card-soft loading-card"><div className="spinner"></div><p>Génération du questionnaire...</p></div>
      )}
      {q.error && <div className="card-soft"><p className="status-warning">{q.error}</p></div>}

      {q.data && (
        <>
          {/* Documentation anglaise */}
          <div className="card-soft">
            <h4 className="report-section-title">Technical documentation (English)</h4>
            <p className="doc-text">{q.data.documentation}</p>
          </div>

          {/* 2 QCU en français */}
          {q.data.closed_questions.map((cq, i) => (
            <div key={`c${i}`} className="card-soft">
              <div className="qcm-question-text"><span className="qcm-number">Q{i + 1}.</span> {cq.question}</div>
              <div className="qcm-choices-grid">
                {cq.choices.map((choice, ci) => {
                  let cls = 'qcm-choice-btn';
                  const detail = q.result?.closed.details[i];
                  if (detail) {
                    if (choice === cq.correct_answer) cls += ' correct';
                    else if (choice === q.closedAnswers[i]) cls += ' incorrect';
                    else cls += ' disabled';
                  } else if (q.closedAnswers[i] === choice) cls += ' selected';
                  return (
                    <button key={ci} className={cls} disabled={!!q.result} onClick={() => q.setClosedAnswer(i, choice)}>
                      {choice}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* 2 questions ouvertes en anglais */}
          {q.data.open_questions.map((oq, i) => (
            <div key={`o${i}`} className="card-soft">
              <div className="qcm-question-text"><span className="qcm-number">Open {i + 1}.</span> {oq.question}</div>
              <textarea
                className="open-answer-input"
                aria-label={`Réponse à la question ouverte ${i + 1}`}
                placeholder="Write your answer in English..."
                value={q.openAnswers[i] || ''}
                onChange={(e) => q.setOpenAnswer(i, e.target.value)}
                disabled={!!q.result}
                rows={4}
              />
              {q.result?.open[i] && (
                <div className="open-feedback">
                  <span className="metric-box"><span className="metric-lbl">Pertinence</span><span className="metric-val">{q.result.open[i].relevance_score}/10</span></span>
                  <span className="metric-box"><span className="metric-lbl">Anglais</span><span className="metric-val">{q.result.open[i].english_score}/10</span></span>
                  <p className="crit-feedback">{q.result.open[i].feedback}</p>
                </div>
              )}
            </div>
          ))}

          {/* Actions */}
          {!q.result ? (
            <button className="btn-dark-pill" onClick={q.submit} disabled={q.submitting}>
              <Sparkles size={16} style={{ marginRight: '8px' }} />
              {q.submitting ? 'Correction en cours...' : 'Soumettre mes réponses'}
            </button>
          ) : (
            <div className="card-soft soutenance-report-card fade-in">
              <h4 className="report-section-title">
                Résultat des questions fermées : {q.result.closed.correct} / {q.result.closed.total}
              </h4>
              <div className="report-phases-list">
                {q.result.closed.details.map((d, i) => (
                  <div key={i} className={`report-phase-row ${d.is_correct ? 'valid' : 'invalid'}`}>
                    <span className="phase-row-icon">{d.is_correct ? <CheckCircle2 size={16} color="var(--color-fern)" /> : <XCircle size={16} color="#d32f2f" />}</span>
                    <span className="phase-row-name">{d.question}</span>
                    {!d.is_correct && <span className="phase-row-feedback">Bonne réponse : {d.correct_answer}</span>}
                  </div>
                ))}
              </div>
              <button className="btn-dark-pill" style={{ marginTop: '16px' }} onClick={() => q.load(stack)}>
                <RefreshCw size={16} style={{ marginRight: '8px' }} />
                Nouveau questionnaire
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default QuestionnairePro;
