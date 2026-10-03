import { useSyncExternalStore } from 'react';
import { getStoredUserSession, AUTH_SESSION_CHANGED_EVENT, type StoredSessionUser } from '@/services/api';
import { canUserAccessInstance } from '@/components/features/auth/utils/instanceAccess';

function subscribeToSessionChanges(onSessionChange: () => void) {
  window.addEventListener(AUTH_SESSION_CHANGED_EVENT, onSessionChange);
  window.addEventListener('storage', onSessionChange);
  return () => {
    window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, onSessionChange);
    window.removeEventListener('storage', onSessionChange);
  };
}

// Una cadena estable evita generar snapshots distintos sin cambios en la sesión.
function readSessionSnapshot() {
  return JSON.stringify(getStoredUserSession());
}

export function usePermissions() {
  const snapshot = useSyncExternalStore(subscribeToSessionChanges, readSessionSnapshot, () => 'null');
  const user = JSON.parse(snapshot) as StoredSessionUser | null;
  const isAdmin = user?.rol === 'ADMIN';
  const userPermissions = Array.isArray(user?.permisos) ? user.permisos : [];

  function canAccessInstance(vmid: number): boolean {
    return canUserAccessInstance(user, vmid);
  }

  function canOperateInstance(vmid: number): boolean {
    if (isAdmin) return true;
    if (user?.rol !== 'OPERATOR') return false;
    // Una asignación antigua sin nivel permite consultar, pero nunca operar.
    const permission = userPermissions.find((entry) => entry?.vmid === vmid);
    return permission?.nivelAcceso === 'FULL_ACCESS';
  }

  return { isAdmin, canAccessInstance, canOperateInstance };
}
