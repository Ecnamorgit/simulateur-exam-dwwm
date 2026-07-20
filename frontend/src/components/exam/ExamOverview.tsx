import React from 'react';
import { Play, Clock } from 'lucide-react';
import { EXAM_PARTS, TOTAL_EXAM_MINUTES, ExamPartId } from '../../data/examParts';

interface Props {
  onStartPart: (id: ExamPartId) => void;
  onStartExamBlanc: () => void;
}

/** Écran d'accueil : présente le déroulé officiel des 4 épreuves (2 h 00). */
const ExamOverview: React.FC<Props> = ({ onStartPart, onStartExamBlanc }) => (
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
  </section>
);

export default ExamOverview;
