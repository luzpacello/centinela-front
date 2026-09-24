import { useEffect, useRef, useState } from 'react';
import { toast } from '@/components/ui/toast';
import { ApiRequestError } from '@/services/apiClient';
import { assignUserInstances, fetchUserInstanceInventory, fetchUserInstancePermissions, instanceVmid, type InstancePermissionLevel, type UserInstance, type UserInstancePermission } from '../services/userInstanceService';
import type { UserDetails } from '../types/user';

export type AccessLevel = 'Acceso completo' | 'Solo lectura' | 'Sin acceso';

function permissionLevelFromAccess(access: Exclude<AccessLevel, 'Sin acceso'>): InstancePermissionLevel {
  return access === 'Solo lectura' ? 'READ_ONLY' : 'FULL_ACCESS';
}

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
  const [assignedPermissions, setAssignedPermissions] = useState<UserInstancePermission[]>([]);
  const assignedIds = assignedPermissions.map((permission) => permission.vmid);
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
      .then(([inventory, permissions]) => {
        if (!controller.signal.aborted) {
          setInstances(inventory);
          setAssignedPermissions(permissions);
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

  async function saveAssignments({ notify = true }: { notify?: boolean } = {}) {
    const pendingInstanceIds = Object.keys(pendingAccess);
    if (saving.current || isLoading || pendingInstanceIds.length === 0) return;
    saving.current = true;
    setIsSaving(true);
    let assignmentWasSaved = false;
    try {
      // El PUT reemplaza todos los permisos: preservar incluso VMID fuera del inventario.
      const currentPermissions = await fetchUserInstancePermissions(user.id);
      const updatedPermissionsByVmid = new Map(currentPermissions.map((permission) => [permission.vmid, permission]));
      for (const instanceId of pendingInstanceIds) {
        const vmid = instanceVmid(instanceId);
        const access = pendingAccess[instanceId];
        if (access === 'Sin acceso') updatedPermissionsByVmid.delete(vmid);
        else updatedPermissionsByVmid.set(vmid, { vmid, nivelAcceso: permissionLevelFromAccess(access) });
      }
      const updatedPermissions = [...updatedPermissionsByVmid.values()];
      await assignUserInstances(user.id, updatedPermissions);
      assignmentWasSaved = true;
      // El 204 confirma la escritura, incluso si falla la lectura de verificación.
      setAssignedPermissions(updatedPermissions);
      const confirmedPermissions = await fetchUserInstancePermissions(user.id);
      setAssignedPermissions(confirmedPermissions);
      const confirmedPermissionsByVmid = new Map(confirmedPermissions.map((permission) => [permission.vmid, permission.nivelAcceso]));
      if (!pendingInstanceIds.every((id) => {
        const access = pendingAccess[id];
        const confirmedLevel = confirmedPermissionsByVmid.get(instanceVmid(id));
        return access === 'Sin acceso'
          ? confirmedLevel === undefined
          : confirmedLevel === permissionLevelFromAccess(access);
      })) {
        throw new ApiRequestError('No se pudieron confirmar los cambios de acceso a instancias.');
      }
      setPendingAccess({});
      if (notify) toast.add({
        title: 'Acceso a instancias actualizado',
        description: 'Los cambios de acceso a instancias se guardaron correctamente.',
        type: 'success',
      });
    } catch (error) {
      if (!notify) {
        if (assignmentWasSaved && !(error instanceof ApiRequestError && [401, 403].includes(error.status))) {
          throw new ApiRequestError('Los permisos se guardaron, pero no se pudo confirmar su estado.');
        }
        throw error;
      }
      reportError(error, assignmentWasSaved
        ? 'Asignación guardada; no se pudo confirmar su estado'
        : 'No se pudo actualizar el acceso a instancias');
    } finally {
      saving.current = false;
      setIsSaving(false);
    }
  }

  return { instances, assignedIds, assignedPermissions, isLoading, isSaving, pendingAccess, changeAccess, saveAssignments };
}
