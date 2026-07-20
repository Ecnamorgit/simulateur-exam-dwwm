import React from 'react';
import NavBar from './components/NavBar';
import CertificationSimulator from './pages/CertificationSimulator';
import './theme.css';

const App: React.FC = () => {
  return (
    <div className="global-container">
      <NavBar />
      <main style={{ marginTop: '100px', padding: '0 24px' }}>
        <CertificationSimulator />
      </main>
    </div>
  );
};

export default App;
