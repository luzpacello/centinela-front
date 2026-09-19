import { useEffect } from 'react';
import { toast } from '@/components/ui/toast';
import { clearAuthTokens } from '@/services/api';
import {
  API_FORBIDDEN_EVENT,
  API_UNAUTHORIZED_EVENT,
  type ApiErrorEventDetail,
} from '@/services/apiClient';

export function ApiResponseNotifier() {
  useEffect(() => {
    function handleForbidden(event: Event) {
      const { detail } = event as CustomEvent<ApiErrorEventDetail>;
      toast.add({
        title: detail.errorCode === 'INSUFFICIENT_PERMISSIONS'
          ? 'Permisos de administrador requeridos'
          : 'Acción rechazada',
        description: detail.message || 'No tenés permisos suficientes para realizar esta acción.',
        type: 'warning',
        priority: 'high',
      });
    }

    function handleUnauthorized() {
      // Un 401 invalida la sesión; un 403 nunca pasa por esta rama.
      clearAuthTokens();
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }

    window.addEventListener(API_FORBIDDEN_EVENT, handleForbidden);
    window.addEventListener(API_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => {
      window.removeEventListener(API_FORBIDDEN_EVENT, handleForbidden);
      window.removeEventListener(API_UNAUTHORIZED_EVENT, handleUnauthorized);
    };
  }, []);

  return null;
}
