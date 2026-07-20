import React from 'react';
import './NavBar.css';

const NavBar: React.FC = () => {
  return (
    <div className="navbar-container">
      <nav className="navbar">
        <div className="navbar-left">
          <span className="navbar-brand">🎓 Simulateur DWWM</span>
        </div>
        <div className="navbar-right">
          <span className="navbar-tagline">Titre Professionnel — RNCP 37674</span>
        </div>
      </nav>
    </div>
  );
};

export default NavBar;
