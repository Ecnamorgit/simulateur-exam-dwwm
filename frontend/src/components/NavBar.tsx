import React from 'react';
import AuthBar from './exam/AuthBar';
import { useAuth } from '../hooks/useAuth';
import './NavBar.css';

interface Props {
  auth: ReturnType<typeof useAuth>;
}

const NavBar: React.FC<Props> = ({ auth }) => {
  return (
    <div className="navbar-container">
      <nav className="navbar">
        <div className="navbar-left">
          <span className="navbar-brand">🎓 Simulateur DWWM</span>
        </div>
        <div className="navbar-right">
          <AuthBar auth={auth} />
        </div>
      </nav>
    </div>
  );
};

export default NavBar;
