import { createContext, createElement, useContext, useEffect, useState } from 'react';
import { API_UNAUTHORIZED_EVENT } from '@/services/apiClient';
import { AUTH_SESSION_CHANGED_EVENT, clearAuthTokens, getAccessToken, getStoredUserSession } from '@/services/api';
import { toast } from '@/components/ui/toast';
import { applicationRouter } from '@/routes/router';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUserSession());

  useEffect(() => {
    function handleSessionChanged(){
      setUser(getStoredUserSession());
    }

    function handleTokenRevoked() {
      const hadActiveSession = Boolean(
        getAccessToken() || getStoredUserSession(),
      );

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

    window.addEventListener( AUTH_SESSION_CHANGED_EVENT, handleSessionChanged,);
    window.addEventListener(API_UNAUTHORIZED_EVENT, handleTokenRevoked);
    return () => {
      window.removeEventListener(
        AUTH_SESSION_CHANGED_EVENT,
        handleSessionChanged,
      );
      window.removeEventListener(
        API_UNAUTHORIZED_EVENT, 
        handleTokenRevoked,
      );
    }
  }, []);

  const hasRole = (role) => user?.rol === role;
  const isAdmin = () => hasRole('ADMIN');
  const isOperator = () => hasRole('OPERATOR');

  const canAccessInstance = (vmid) =>
    (user?.instanciasPermitidas ?? []).includes(vmid);

  const value = {
    user,
    hasRole,
    isAdmin,
    isOperator,
    canAccessInstance
  };

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de un AuthProvider');
  }

  return context;
}