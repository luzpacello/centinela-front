import { useEffect } from 'react';
import { toast } from '@/components/ui/toast';
import { clearAuthTokens } from '@/services/api';
import {
  API_FORBIDDEN_EVENT,
  API_SESSION_EXPIRED_EVENT,
  type ApiErrorEventDetail,
} from '@/services/apiClient';
import { applicationRouter } from '@/routes/router';
import { getErrorMessage } from '@/utils/errorMapper';

function showUnauthorizedToast(message?: string) {
  toast.add({
    title: 'Sesión vencida',
    description: message || 'Tu sesión ya no es válida. Iniciá sesión nuevamente.',
    type: 'warning',
    priority: 'high',
  });
}

// Títulos para los 403 que emite el backend (incluyendo instancias protegidas y denegadas)
const forbiddenTitles: Record<string, string> = {
  INSUFFICIENT_PERMISSIONS: 'Permisos de administrador requeridos',
  NO_ROLE: 'Permisos de administrador requeridos',
  INVALID_ROLE: 'Permisos de administrador requeridos',
  '2FA_REQUIRED': 'Verificación en dos pasos requerida',
  PASSWORD_CHANGE_REQUIRED: 'Cambio de contraseña requerido',
  INSTANCE_PROTECTED: 'Instancia protegida',
  INSTANCE_ACCESS_DENIED: 'Acceso denegado',
};

export function ApiResponseNotifier() {
  useEffect(() => {
    function handleForbidden(event: Event) {
      const { detail } = event as CustomEvent<ApiErrorEventDetail>;
      toast.add({
        title: (detail.errorCode && forbiddenTitles[detail.errorCode]) || 'Acción rechazada',
        description: getErrorMessage(detail),
        type: 'warning',
        priority: 'high',
      });
    }

    function handleUnauthorized(event: Event) {
      const { detail } = event as CustomEvent<ApiErrorEventDetail>;
      const currentPath = window.location.pathname;

      if (currentPath.includes('/two-factor')) {
        return;
      }

      clearAuthTokens();
      if (window.location.pathname !== '/login') {
        showUnauthorizedToast(detail.message);
        void applicationRouter.navigate('/login', { replace: true });
      }
    }

    window.addEventListener(API_FORBIDDEN_EVENT, handleForbidden);
    window.addEventListener(API_SESSION_EXPIRED_EVENT, handleUnauthorized);
    return () => {
      window.removeEventListener(API_FORBIDDEN_EVENT, handleForbidden);
      window.removeEventListener(API_SESSION_EXPIRED_EVENT, handleUnauthorized);
    };
  }, []);

  return null;
}