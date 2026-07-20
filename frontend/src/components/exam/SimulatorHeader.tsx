import React from 'react';
import AuthBar from './AuthBar';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  auth: ReturnType<typeof useAuth>;
}

/** En-tête du simulateur (titre + barre d'authentification). */
const SimulatorHeader: React.FC<Props> = ({ auth }) => (
  <header className="hero-section">
    <h1 className="hero-brand">Anything</h1>
    <h2 className="hero-headline">Simulateur de Certification</h2>
    <p className="hero-subtext">
      daylight reverie: préparez méthodiquement votre épreuve de Titre Professionnel DWWM
    </p>
    <AuthBar auth={auth} />
  </header>
);

export default SimulatorHeader;
