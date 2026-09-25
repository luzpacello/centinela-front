import { createContext, createElement, useEffect, useState } from 'react';
import { API_UNAUTHORIZED_EVENT } from '@/services/apiClient';
import { clearAuthTokens, getAccessToken, getStoredUserSession } from '@/services/api';
import { toast } from '@/components/ui/toast';
import { applicationRouter } from '@/routes/router';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUserSession());

  useEffect(() => {
    function handleTokenRevoked() {
      const hadActiveSession = Boolean(
        getAccessToken() || getStoredUserSession(),
      );

      setUser(null);
      clearAuthTokens();

      if (!hadActiveSession) return;

      toast.add({
        title: 'Sesión finalizada',
        description: 'Tu sesión ha expirado o fue cerrada en otro dispositivo.',
        type: 'info',
        priority: 'high',
      });
      void applicationRouter.navigate('/login', { replace: true });
    }

    window.addEventListener(API_UNAUTHORIZED_EVENT, handleTokenRevoked);
    return () => window.removeEventListener(API_UNAUTHORIZED_EVENT, handleTokenRevoked);
  }, []);

  return createElement(AuthContext.Provider, { value: user }, children);
}
