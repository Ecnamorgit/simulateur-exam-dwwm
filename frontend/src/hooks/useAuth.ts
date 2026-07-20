import { useState } from 'react';
import { login, register, setAuthToken } from '../services/api';

/** Authentification côté client : token JWT conservé en mémoire (pas de persistance). */
export function useAuth() {
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const doLogin = async (em: string, pw: string): Promise<boolean> => {
    setBusy(true); setError('');
    try {
      const token = await login(em, pw);
      setAuthToken(token);
      setEmail(em);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally { setBusy(false); }
  };

  const doRegister = async (em: string, pw: string): Promise<boolean> => {
    setBusy(true); setError('');
    try {
      await register(em, pw);
      const token = await login(em, pw);
      setAuthToken(token);
      setEmail(em);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally { setBusy(false); }
  };

  const logout = () => { setAuthToken(null); setEmail(null); setError(''); };

  return { email, isAuthenticated: !!email, error, busy, doLogin, doRegister, logout };
}
