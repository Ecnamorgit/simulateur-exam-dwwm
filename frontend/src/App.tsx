import React from 'react';
import NavBar from './components/NavBar';
import CertificationSimulator from './pages/CertificationSimulator';
import { useAuth } from './hooks/useAuth';
import './theme.css';

const App: React.FC = () => {
  // L'authentification est partagée entre la barre du haut (login) et le simulateur.
  const auth = useAuth();
  return (
    <div className="global-container">
      <NavBar auth={auth} />
      <main style={{ marginTop: '110px', padding: '0 24px' }}>
        <CertificationSimulator auth={auth} />
      </main>
    </div>
  );
};

export default App;
