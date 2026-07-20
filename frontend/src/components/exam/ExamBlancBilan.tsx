import React, { useState } from 'react';
import { CheckCircle2, XCircle, Save } from 'lucide-react';
import { EXAM_PARTS, TOTAL_EXAM_MINUTES } from '../../data/examParts';
import { ExamBlancResults } from '../../hooks/useExamBlanc';
import { createSession } from '../../services/api';

interface Props {
  results: ExamBlancResults;
  onBack: () => void;
}

function verdictFor(avg: number): { label: string; tone: 'good' | 'mid' | 'low' } {
  if (avg >= 70) return { label: 'Admis (verdict indicatif)', tone: 'good' };
  if (avg >= 50) return { label: 'Entretien complémentaire recommandé', tone: 'mid' };
  return { label: 'Préparation à renforcer', tone: 'low' };
}

/** Bilan global d'un examen blanc complet : synthèse des 4 épreuves + verdict + sauvegarde. */
const ExamBlancBilan: React.FC<Props> = ({ results, onBack }) => {
  const scores = EXAM_PARTS.map((p) => ({ part: p, score: results[p.id] }));
  const done = scores.filter((s) => typeof s.score === 'number');
  const avg = done.length ? Math.round(done.reduce((a, s) => a + (s.score as number), 0) / done.length) : 0;
  const verdict = verdictFor(avg);

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const summary = scores.map((s) => `${s.part.title}: ${typeof s.score === 'number' ? s.score + '/100' : 'non réalisée'}`).join(' | ');
      await createSession({
        duration_seconds: TOTAL_EXAM_MINUTES * 60,
        score: avg,
        transcript: `Bilan examen blanc — ${summary}. Verdict : ${verdict.label}.`,
        status: 'examen_blanc_complete',
        exam_part: 'examen-blanc',
      });
      setSaved(true);
    } catch (e) {
      console.error(e);
      setError("L'enregistrement a échoué. Vérifiez que le backend est démarré.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="tab-content fade-in">
      <div className="card-soft soutenance-report-card">
        <div className="report-header">
          <div>
            <h3 className="card-title">Bilan de l'examen blanc complet</h3>
            <p className="card-subtitle">Synthèse des 4 épreuves de la certification DWWM (2 h 00)</p>
          </div>
          <div className="report-main-score">
            <span className="score-number">{avg}</span>
            <span className="score-denom">/100</span>
          </div>
        </div>

        <div className={`exam-verdict ${verdict.tone}`}>{verdict.label}</div>

        <h4 className="report-section-title">Résultats par épreuve (AT1 front-end / AT2 back-end / transversal)</h4>
        <div className="report-phases-list">
          {scores.map(({ part, score }) => (
            <div key={part.id} className={`report-phase-row ${typeof score === 'number' ? 'valid' : 'invalid'}`}>
              <span className="phase-row-icon">
                {typeof score === 'number'
                  ? <CheckCircle2 size={16} color="var(--color-fern)" />
                  : <XCircle size={16} color="#d32f2f" />}
              </span>
              <span className="phase-row-name">{part.icon} {part.title}</span>
              <span className="phase-row-feedback">
                {typeof score === 'number' ? `${score}/100` : 'Non réalisée'}
              </span>
            </div>
          ))}
        </div>

        <div className="report-feedback-columns">
          <div className="feedback-col strengths">
            <h4 className="report-section-title">👍 Points forts</h4>
            <ul>
              {scores.filter((s) => (s.score ?? 0) >= 70).map((s) => <li key={s.part.id}>{s.part.title}</li>)}
              {scores.filter((s) => (s.score ?? 0) >= 70).length === 0 && <li>À consolider sur l'ensemble des épreuves.</li>}
            </ul>
          </div>
          <div className="feedback-col improvements">
            <h4 className="report-section-title">🎯 Axes d'amélioration</h4>
            <ul>
              {scores.filter((s) => typeof s.score === 'number' && (s.score as number) < 70).map((s) => <li key={s.part.id}>{s.part.title}</li>)}
              {scores.filter((s) => typeof s.score === 'number' && (s.score as number) < 70).length === 0 && <li>Excellent niveau global, continuez ainsi !</li>}
            </ul>
          </div>
        </div>

        {error && <p className="status-warning">{error}</p>}
        <div className="timer-controls" style={{ marginTop: '16px' }}>
          {!saved ? (
            <button className="btn-dark-pill" onClick={save} disabled={saving}>
              <Save size={16} style={{ marginRight: '8px' }} />
              {saving ? 'Enregistrement...' : 'Enregistrer ce bilan dans l\'historique'}
            </button>
          ) : (
            <span className="status-success"><CheckCircle2 size={16} /> Bilan enregistré dans l'historique</span>
          )}
          <button className="btn-outline-pill" onClick={onBack}>Retour au déroulé</button>
        </div>
      </div>
    </section>
  );
};

export default ExamBlancBilan;
