import React from 'react';
import './NavBar.css';

const NavBar: React.FC = () => {
  return (
    <div className="navbar-container">
      <nav className="navbar">
        <div className="navbar-left">
          <span className="navbar-brand">Anything</span>
        </div>
        <div className="navbar-center">
          <ul className="navbar-links">
            <li><a href="#simulateur" className="nav-link">Simulateur</a></li>
            <li><a href="#dossier" className="nav-link">Mon Dossier</a></li>
            <li><a href="#backlog" className="nav-link">Backlog</a></li>
            <li><a href="#owasp" className="nav-link">OWASP</a></li>
          </ul>
        </div>
        <div className="navbar-right">
          <button className="btn-dark-pill">Lancer Simulation</button>
        </div>
      </nav>
    </div>
  );
};

export default NavBar;
