import React, { useEffect, useState } from 'react';
import { Play, Clock, History, Award } from 'lucide-react';
import { EXAM_PARTS, TOTAL_EXAM_MINUTES, ExamPartId } from '../../data/examParts';
import { getSessions, getMyBadges } from '../../services/api';
import ProgressChart from './ProgressChart';

interface Props {
  onStartPart: (id: ExamPartId) => void;
  onStartExamBlanc: () => void;
  authKey?: string;
}

/** Écran d'accueil : présente le déroulé officiel des 4 épreuves (2 h 00). */
const ExamOverview: React.FC<Props> = ({ onStartPart, onStartExamBlanc, authKey }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);

  useEffect(() => {
    getSessions()
      .then((all) => setHistory(all.filter((s) => s.exam_part === 'examen-blanc')))
      .catch(() => setHistory([]));
    if (authKey) getMyBadges().then(setBadges).catch(() => setBadges([]));
    else setBadges([]);
  }, [authKey]);

  return (
  <section className="tab-content fade-in">
    <div className="card-soft page-intro-card">
      <h3 className="card-title">Déroulé officiel de l'épreuve (2 h 00)</h3>
      <p className="card-subtitle">
        La certification DWWM se compose de 4 épreuves successives, pour une durée totale de {TOTAL_EXAM_MINUTES} minutes.
        Entraînez-vous épreuve par épreuve, ou lancez un examen blanc complet.
      </p>
      <button className="btn-dark-pill" onClick={onStartExamBlanc}>
        <Play size={16} style={{ marginRight: '8px' }} />
        Démarrer un examen blanc complet
      </button>
    </div>

    <div className="exam-parts-list">
      {EXAM_PARTS.map((part) => (
        <div key={part.id} className="card-soft exam-part-card">
          <div className="exam-part-order">{part.order}</div>
          <div className="exam-part-body">
            <div className="exam-part-head">
              <span className="exam-part-icon">{part.icon}</span>
              <h4 className="exam-part-title">{part.title}</h4>
              <span className="exam-part-duration">
                <Clock size={14} style={{ marginRight: '4px' }} />
                {part.durationMin} min
              </span>
            </div>
            <p className="exam-part-desc">{part.description}</p>
            <button className="btn-outline-pill" onClick={() => onStartPart(part.id)}>
              <Play size={14} style={{ marginRight: '6px' }} />
              S'entraîner à cette épreuve
            </button>
          </div>
        </div>
      ))}
    </div>

    {badges.length > 0 && (
      <div className="card-soft" style={{ maxWidth: '820px', margin: '24px auto 0' }}>
        <h4 className="report-section-title"><Award size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />Badges de compétences obtenus</h4>
        <div className="badges-strip">
          {badges.map((b) => (
            <span key={b.code} className="badge-chip" title={b.description}>🏅 {b.label}</span>
          ))}
        </div>
      </div>
    )}

    {history.length > 0 && (
      <div className="card-soft" style={{ maxWidth: '820px', margin: '24px auto 0' }}>
        <h4 className="report-section-title"><History size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />Historique des examens blancs</h4>
        <ProgressChart points={[...history].reverse().map((s) => ({ date: s.date, score: s.score }))} />
        <div className="report-phases-list">
          {history.map((s) => (
            <div key={s.id} className="report-phase-row valid">
              <span className="phase-row-name">
                {s.date ? new Date(s.date).toLocaleDateString('fr-FR') : 'Session'} — {s.transcript}
              </span>
              <span className="phase-row-feedback">{s.score}/100</span>
            </div>
          ))}
        </div>
      </div>
    )}
  </section>
  );
};

export default ExamOverview;
