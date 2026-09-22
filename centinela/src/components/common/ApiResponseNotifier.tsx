import { useEffect } from 'react';
import { toast } from '@/components/ui/toast';
import { clearAuthTokens } from '@/services/api';
import {
  API_FORBIDDEN_EVENT,
  API_UNAUTHORIZED_EVENT,
  type ApiErrorEventDetail,
} from '@/services/apiClient';

const unauthorizedToastStorageKey = 'centinela:unauthorized-toast';

function showUnauthorizedToast(message?: string) {
  toast.add({
    title: 'Sesión vencida',
    description: message || 'Tu sesión ya no es válida. Iniciá sesión nuevamente.',
    type: 'warning',
    priority: 'high',
  });
}
// Títulos para los 403 que emite hoy el backend.
const forbiddenTitles: Record<string, string> = {
  INSUFFICIENT_PERMISSIONS: 'Permisos de administrador requeridos',
  NO_ROLE: 'Permisos de administrador requeridos',
  INVALID_ROLE: 'Permisos de administrador requeridos',
  '2FA_REQUIRED': 'Verificación en dos pasos requerida',
  PASSWORD_CHANGE_REQUIRED: 'Cambio de contraseña requerido',
};

export function ApiResponseNotifier() {
  useEffect(() => {
    const pendingUnauthorizedMessage = window.sessionStorage.getItem(unauthorizedToastStorageKey);
    if (pendingUnauthorizedMessage) {
      window.sessionStorage.removeItem(unauthorizedToastStorageKey);
      showUnauthorizedToast(pendingUnauthorizedMessage);
    }

    function handleForbidden(event: Event) {
      const { detail } = event as CustomEvent<ApiErrorEventDetail>;
      toast.add({
        title: (detail.errorCode && forbiddenTitles[detail.errorCode]) || 'Acción rechazada',
        description: detail.message || 'No tenés permisos suficientes para realizar esta acción.',
        type: 'warning',
        priority: 'high',
      });
    }

    function handleUnauthorized(event: Event) {
      const { detail } = event as CustomEvent<ApiErrorEventDetail>;
      const currentPath = window.location.pathname;

      // EXCEPCIÓN: Si estamos en las rutas de doble factor, un 401 (código incorrecto) 
      // NO debe expulsar al usuario al login; dejamos que el formulario maneje el error localmente.
      if (currentPath.includes('/two-factor')) {
        return;
      }
      // Un 401 invalida la sesión; un 403 nunca pasa por esta rama.
      clearAuthTokens();
      if (window.location.pathname !== '/login') {
        window.sessionStorage.setItem(
          unauthorizedToastStorageKey,
          detail.message || 'Tu sesión ya no es válida. Iniciá sesión nuevamente.',
        );
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
