import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react';
import { API_UNAUTHORIZED_EVENT } from '@/services/apiClient';
import { AUTH_SESSION_CHANGED_EVENT, clearAuthTokens, getAccessToken, getStoredUserSession, type StoredSessionUser } from '@/services/api';
import { toast } from '@/components/ui/toast';
import { applicationRouter } from '@/routes/router';

interface AuthContextValue {
  user: StoredSessionUser | null;
  hasRole: (role: string) => boolean;
  isAdmin: () => boolean;
  isOperator: () => boolean;
  canAccessInstance: (vmid: number) => boolean;
}

interface AuthProviderProps { children: ReactNode; }

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<StoredSessionUser | null>(
    () => getStoredUserSession() ?? null,
  );

  useEffect(() => {
    function handleSessionChanged(){
      setUser(getStoredUserSession() ?? null);
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

  const hasRole = (role: string): boolean => user?.rol === role;
  const isAdmin = (): boolean => hasRole('ADMIN');
  const isOperator = (): boolean => hasRole('OPERATOR');

  const canAccessInstance = (vmid: number): boolean =>
    (user?.instanciasPermitidas ?? []).includes(vmid);

  const value: AuthContextValue = {
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