import React from 'react';

/** En-tête du simulateur (titre + accroche). L'authentification est dans la barre du haut. */
const SimulatorHeader: React.FC = () => (
  <header className="hero-section">
    <h1 className="hero-brand">Examen blanc DWWM</h1>
    <h2 className="hero-headline">Préparez votre certification</h2>
    <p className="hero-subtext">
      Entraînez-vous au déroulé complet de l'épreuve (2 h) : soutenance, entretien technique,
      questionnaire professionnel et entretien final.
    </p>
  </header>
);

export default SimulatorHeader;
