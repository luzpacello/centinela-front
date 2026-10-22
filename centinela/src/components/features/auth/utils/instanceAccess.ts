import type { StoredSessionUser } from '@/services/api';
import type { InstanceRef } from '../../instances/types/instance';

// Regla compartida: el nivel por recurso no reemplaza la asignación de la instancia.
export function canUserAccessInstance(
  user: Pick<StoredSessionUser, 'rol' | 'instanciasPermitidas'> | null | undefined,
  vmid: InstanceRef,
): boolean {
  if (user?.rol === 'ADMIN') return true;
  if (user?.rol !== 'OPERATOR') return false;
  return Array.isArray(user.instanciasPermitidas) && user.instanciasPermitidas.includes(vmid);
}
