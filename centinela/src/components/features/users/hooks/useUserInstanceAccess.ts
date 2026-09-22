import { useEffect, useRef, useState } from 'react';
import { toast } from '@/components/ui/toast';
import { ApiRequestError } from '@/services/apiClient';
import { fetchUserDetails } from '../services/userDetailsService';
import { assignUserInstances, fetchUserInstanceInventory, instanceVmid, type UserInstance } from '../services/userInstanceService';
import type { UserDetails } from '../types/user';

export type AccessLevel = 'Acceso completo' | 'Solo lectura' | 'Sin acceso';

function reportError(error: unknown) {
  // ApiResponseNotifier ya presenta los errores de sesión y permisos.
  if (error instanceof ApiRequestError && [401, 403].includes(error.status)) return;
  toast.add({
    title: 'No se pudo actualizar el acceso a instancias',
    description: error instanceof Error ? error.message : 'Intentá nuevamente.',
    type: 'error',
  });
}

export function useUserInstanceAccess(user: UserDetails) {
  const [instances, setInstances] = useState<UserInstance[]>([]);
  const [assignedIds, setAssignedIds] = useState(user.instanciasPermitidas);
  const [savedRole, setSavedRole] = useState(user.rol);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const saving = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchUserInstanceInventory(controller.signal)
      .then((inventory) => {
        if (!controller.signal.aborted) setInstances(inventory);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) reportError(error);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, []);

  async function changeAccess(instance: UserInstance, access: AccessLevel) {
    if (access === 'Sin acceso' || saving.current || isLoading) return;
    saving.current = true;
    setIsSaving(true);
    try {
      // El PUT reemplaza todos los permisos: preservar incluso VMID fuera del inventario.
      const currentUser = await fetchUserDetails(user.id);
      const vmid = instanceVmid(instance.id);
      const vmids = [...new Set([...currentUser.instanciasPermitidas.map(instanceVmid), vmid])];
      await assignUserInstances(user.id, vmids);
      // El 204 confirma la escritura, incluso si falla la lectura de verificación.
      setAssignedIds(vmids);
      setSavedRole(currentUser.rol);
      const confirmedUser = await fetchUserDetails(user.id);
      setAssignedIds(confirmedUser.instanciasPermitidas);
      setSavedRole(confirmedUser.rol);
      if (!confirmedUser.instanciasPermitidas.some((id) => instanceVmid(id) === vmid)) {
        throw new ApiRequestError('No se pudo confirmar la asignación de la instancia.');
      }
      toast.add({
        title: 'Instancia asignada',
        description: `${instance.name} (${vmid}) se asignó correctamente al usuario.`,
        type: 'success',
      });
    } catch (error) {
      reportError(error);
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  }

  return { instances, assignedIds, savedRole, isLoading, isSaving, changeAccess };
}
