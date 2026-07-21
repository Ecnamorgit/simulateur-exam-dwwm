import React from 'react';
import { Play, Upload, CheckCircle, X, Presentation } from 'lucide-react';

interface Props {
  selectedFile: File | null;
  presentationFile: File | null;
  onClose: () => void;
  onConfirm: (mode: 'dossier' | 'generic') => void;
  onFileSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPresentationSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/** Modal de démarrage de la soutenance (choix : avec ou sans dossier, + présentation à afficher). */
const SoutenanceModal: React.FC<Props> = ({
  selectedFile, presentationFile, onClose, onConfirm, onFileSelected, onPresentationSelected,
}) => (
  <div className="modal-overlay fade-in">
    <div className="modal-card">
      <div className="modal-header">
        <div className="modal-icon">🎒</div>
        <button className="close-btn" onClick={onClose}><X size={18} /></button>
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
        onChange={onFileSelected}
      />

      {/* Présentation à projeter dans la fenêtre popup pendant la soutenance */}
      <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed var(--border, #e5e7eb)' }}>
        <p className="modal-subtitle" style={{ marginBottom: '10px' }}>
          <strong>Votre support de présentation</strong> — chargez le fichier que vous projetterez pendant l'oral.
          Une fenêtre s'ouvrira à côté pour que vous voyiez vos slides.
        </p>

        {presentationFile ? (
          <div className="file-ready-badge">
            <CheckCircle size={16} color="var(--color-fern)" />
            <span>Présentation chargée : <strong>{presentationFile.name}</strong></span>
          </div>
        ) : null}

        <input
          type="file"
          id="soutenance-presentation-upload"
          accept=".pdf,.pptx,image/*"
          style={{ display: 'none' }}
          onChange={onPresentationSelected}
        />

        <button
          className="btn-outline-pill modal-btn"
          style={{ width: '100%' }}
          onClick={() => document.getElementById('soutenance-presentation-upload')?.click()}
        >
          <Presentation size={16} style={{ marginRight: '8px' }} />
          {presentationFile ? 'Changer de présentation' : 'Charger ma présentation (PowerPoint / PDF)'}
        </button>
      </div>

      <div className="modal-actions" style={{ marginTop: '20px' }}>
        <button className="btn-dark-pill modal-btn" onClick={() => onConfirm('dossier')}>
          <Upload size={16} style={{ marginRight: '8px' }} />
          {selectedFile ? 'Démarrer avec ce dossier' : 'Charger mon dossier (PDF / Word)'}
        </button>
        <button className="btn-outline-pill modal-btn" onClick={() => onConfirm('generic')}>
          <Play size={16} style={{ marginRight: '8px' }} />
          Démarrer en mode générique (Sans dossier)
        </button>
      </div>
    </div>
  </div>
);

export default SoutenanceModal;
