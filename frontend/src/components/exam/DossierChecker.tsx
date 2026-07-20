import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import Separator from '../Separator';
import { AnalysisResult } from '../../types/exam';

interface Props {
  selectedFile: File | null;
  analyzing: boolean;
  analysisResult: AnalysisResult | null;
  error?: string;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/** Onglet « Validation de Dossier » : upload + analyse de conformité. */
const DossierChecker: React.FC<Props> = ({ selectedFile, analyzing, analysisResult, error, handleFileChange }) => (
  <section className="tab-content fade-in">
    <div className="card-soft upload-card">
      <h3 className="card-title">Analyseur de Conformité du Dossier de Projet</h3>
      <p className="card-subtitle">Glissez-déposez ou sélectionnez votre fichier de projet (PDF ou Word, 30-50 pages réglementaires)</p>

      <div className="file-drop-zone">
        <input type="file" id="file-upload" accept=".pdf,.docx,.md,.txt" onChange={handleFileChange} style={{ display: 'none' }} />
        <label htmlFor="file-upload" className="upload-label">
          <span className="upload-text-main">Sélectionner un fichier</span>
          <span className="upload-text-sub">Fichiers acceptés : .pdf, .docx, .md, .txt (max 20 Mo)</span>
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

      {error && (
        <div className="warning-box" style={{ marginTop: '16px' }}>
          <AlertTriangle size={18} className="warn-icon" />
          <span>{error}</span>
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
);

export default DossierChecker;
