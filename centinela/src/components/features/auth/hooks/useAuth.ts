import { useState } from 'react';
import { useNavigate } from 'react-router';
import { logoutSession } from '../services/authService';
import { clearAuthTokens } from '@/services/api';

export function useLogout() {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function logout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logoutSession();
    } catch {
      // El cierre local continúa aunque el backend no responda.
    } finally {
      clearAuthTokens();
      navigate('/login', { replace: true });
    }
  }

  return { isLoggingOut, logout };
}
