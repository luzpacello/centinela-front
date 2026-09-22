import { useEffect, useRef, useState } from 'react';
import { toast } from '@/components/ui/toast';
import { ApiRequestError } from '@/services/apiClient';
import { assignUserInstances, fetchUserInstanceInventory, fetchUserInstancePermissions, instanceVmid, type UserInstance } from '../services/userInstanceService';
import type { UserDetails } from '../types/user';

export type AccessLevel = 'Acceso completo' | 'Solo lectura' | 'Sin acceso';

function reportError(error: unknown, title = 'No se pudo actualizar el acceso a instancias') {
  // ApiResponseNotifier ya presenta los errores de sesión y permisos.
  if (error instanceof ApiRequestError && [401, 403].includes(error.status)) return;
  toast.add({
    title,
    description: error instanceof Error ? error.message : 'Intentá nuevamente.',
    type: 'error',
  });
}

export function useUserInstanceAccess(user: UserDetails) {
  const [instances, setInstances] = useState<UserInstance[]>([]);
  const [assignedIds, setAssignedIds] = useState<number[]>([]);
  const savedRole = user.rol;
  const [pendingAccess, setPendingAccess] = useState<Record<string, AccessLevel>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const saving = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetchUserInstanceInventory(controller.signal),
      fetchUserInstancePermissions(user.id, controller.signal),
    ])
      .then(([inventory, permittedVmids]) => {
        if (!controller.signal.aborted) {
          setInstances(inventory);
          setAssignedIds(permittedVmids);
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) reportError(error, 'No se pudieron cargar las instancias o sus permisos');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [user.id]);

  async function changeAccess(instance: UserInstance, access: AccessLevel) {
    if (saving.current || isLoading) return;
    setPendingAccess((previousAccess) => {
      const updatedAccess = { ...previousAccess };
      // Si no estaba asignada, Sin acceso solo cancela una selección pendiente.
      if (access === 'Sin acceso' && !assignedIds.includes(instanceVmid(instance.id))) delete updatedAccess[instance.id];
      else updatedAccess[instance.id] = access;
      return updatedAccess;
    });
  }

  async function saveAssignments() {
    const pendingInstanceIds = Object.keys(pendingAccess);
    if (saving.current || isLoading || pendingInstanceIds.length === 0) return;
    saving.current = true;
    setIsSaving(true);
    let assignmentWasSaved = false;
    try {
      // El PUT reemplaza todos los permisos: preservar incluso VMID fuera del inventario.
      const currentPermittedVmids = await fetchUserInstancePermissions(user.id);
      const updatedPermittedVmids = new Set(currentPermittedVmids);
      for (const instanceId of pendingInstanceIds) {
        const vmid = instanceVmid(instanceId);
        if (pendingAccess[instanceId] === 'Sin acceso') updatedPermittedVmids.delete(vmid);
        else updatedPermittedVmids.add(vmid);
      }
      const vmids = [...updatedPermittedVmids];
      await assignUserInstances(user.id, vmids);
      assignmentWasSaved = true;
      // El 204 confirma la escritura, incluso si falla la lectura de verificación.
      setAssignedIds(vmids);
      const confirmedPermittedVmids = await fetchUserInstancePermissions(user.id);
      setAssignedIds(confirmedPermittedVmids);
      const confirmedVmids = new Set(confirmedPermittedVmids);
      if (!pendingInstanceIds.every((id) => confirmedVmids.has(instanceVmid(id)) === (pendingAccess[id] !== 'Sin acceso'))) {
        throw new ApiRequestError('No se pudieron confirmar los cambios de acceso a instancias.');
      }
      setPendingAccess({});
      toast.add({
        title: 'Acceso a instancias actualizado',
        description: 'Los cambios de acceso a instancias se guardaron correctamente.',
        type: 'success',
      });
    } catch (error) {
      reportError(error, assignmentWasSaved
        ? 'Asignación guardada; no se pudo confirmar su estado'
        : 'No se pudo actualizar el acceso a instancias');
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  }

  return { instances, assignedIds, savedRole, isLoading, isSaving, pendingAccess, changeAccess, saveAssignments };
}
