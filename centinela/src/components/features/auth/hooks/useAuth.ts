import { useState } from 'react';
import { useNavigate } from 'react-router';
import { logoutSession } from '../services/authService';
import { clearPendingLoginSession } from '../services/pendingLoginSession';

export function useLogout() {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function logout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logoutSession();
    } finally {
      clearPendingLoginSession();
      navigate('/login', { replace: true });
    }
  }

  return { isLoggingOut, logout };
}
