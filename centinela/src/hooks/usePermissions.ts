import { useSyncExternalStore } from 'react';
import { getStoredUserSession, USER_SESSION_CHANGED_EVENT, type StoredSessionUser } from '@/services/api';

function subscribeToSessionChanges(onSessionChange: () => void) {
  window.addEventListener(USER_SESSION_CHANGED_EVENT, onSessionChange);
  window.addEventListener('storage', onSessionChange);
  return () => {
    window.removeEventListener(USER_SESSION_CHANGED_EVENT, onSessionChange);
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
    if (isAdmin) return true;
    if (!user || !['OPERATOR', 'READ_ONLY'].includes(user.rol)) return false;
    return userPermissions.some((permission) => permission?.vmid === vmid
      && ['FULL_ACCESS', 'READ_ONLY'].includes(permission.nivelAcceso))
      || (Array.isArray(user.instanciasPermitidas) && user.instanciasPermitidas.includes(vmid));
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
