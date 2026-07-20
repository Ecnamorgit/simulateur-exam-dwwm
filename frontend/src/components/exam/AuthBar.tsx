import React, { useState } from 'react';
import { LogIn, LogOut, UserPlus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  auth: ReturnType<typeof useAuth>;
}

/** Barre d'authentification : login/register compact ou état connecté. */
const AuthBar: React.FC<Props> = ({ auth }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (auth.isAuthenticated) {
    return (
      <div className="auth-bar">
        <span className="auth-user">Connecté·e : <strong>{auth.email}</strong></span>
        <button className="btn-outline-pill auth-btn" onClick={auth.logout}>
          <LogOut size={14} style={{ marginRight: '6px' }} /> Déconnexion
        </button>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') await auth.doLogin(email, password);
    else await auth.doRegister(email, password);
  };

  return (
    <form className="auth-bar" onSubmit={submit}>
      <input
        className="auth-input" type="email" placeholder="Email" required aria-label="Adresse email"
        value={email} onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="auth-input" type="password" placeholder="Mot de passe (8+ car.)" required aria-label="Mot de passe"
        value={password} onChange={(e) => setPassword(e.target.value)}
      />
      <button className="btn-dark-pill auth-btn" type="submit" disabled={auth.busy}>
        {mode === 'login'
          ? <><LogIn size={14} style={{ marginRight: '6px' }} /> Connexion</>
          : <><UserPlus size={14} style={{ marginRight: '6px' }} /> Créer un compte</>}
      </button>
      <button
        type="button" className="auth-switch"
        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
      >
        {mode === 'login' ? "Pas de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
      </button>
      {auth.error && <span className="auth-error">{auth.error}</span>}
    </form>
  );
};

export default AuthBar;
