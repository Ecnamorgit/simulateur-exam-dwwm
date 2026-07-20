import React from 'react';
import AuthBar from './AuthBar';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  auth: ReturnType<typeof useAuth>;
}

/** En-tête du simulateur (titre + barre d'authentification). */
const SimulatorHeader: React.FC<Props> = ({ auth }) => (
  <header className="hero-section">
    <h1 className="hero-brand">Examen blanc DWWM</h1>
    <h2 className="hero-headline">Préparez votre certification</h2>
    <p className="hero-subtext">
      Entraînez-vous au déroulé complet de l'épreuve (2 h) : soutenance, entretien technique,
      questionnaire professionnel et entretien final.
    </p>
    <AuthBar auth={auth} />
  </header>
);

export default SimulatorHeader;
