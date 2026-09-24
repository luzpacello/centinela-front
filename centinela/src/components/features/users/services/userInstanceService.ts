import { ApiRequestError, apiClient } from '@/services/apiClient';

export interface UserInstance {
  id: string;
  name: string;
  type: 'VM' | 'LXC';
}

export type InstancePermissionLevel = 'FULL_ACCESS' | 'READ_ONLY';

export interface UserInstancePermission {
  vmid: number;
  nivelAcceso: InstancePermissionLevel;
}

export function instanceVmid(id: string | number): number {
  const value = String(id).replace(/^(qemu|lxc)\//, '');
  const vmid = /^\d+$/.test(value) ? Number(value) : NaN;
  if (!Number.isSafeInteger(vmid) || vmid <= 0) {
    throw new ApiRequestError('La instancia no tiene un VMID válido.');
  }
  return vmid;
}

export async function fetchUserInstanceInventory(signal?: AbortSignal): Promise<UserInstance[]> {
  const response = await apiClient.get<unknown>('/instances', {
    signal, expectedStatus: 200,
  });
  if (!Array.isArray(response)) {
    throw new ApiRequestError('No se pudo interpretar el inventario de instancias.');
  }
  return response.map((instance): UserInstance => {
    if (!instance || typeof instance.id !== 'number' || typeof instance.name !== 'string'
      || typeof instance.type !== 'string') {
      throw new ApiRequestError('No se pudo interpretar el inventario de instancias.');
    }
    // El backend devuelve vm/lxc; la tabla conserva sus etiquetas VM/LXC.
    const instanceType = instance.type.toUpperCase();
    if (instanceType !== 'VM' && instanceType !== 'LXC') {
      throw new ApiRequestError('El inventario contiene un tipo de instancia desconocido.');
    }
    return { id: String(instanceVmid(instance.id)), name: instance.name, type: instanceType };
  });
}

export async function fetchUserInstancePermissions(userId: string, signal?: AbortSignal): Promise<UserInstancePermission[]> {
  const response = await apiClient.get<{ permisos: UserInstancePermission[] }>(
    `/admin/users/${encodeURIComponent(userId)}/permissions`,
    { signal, expectedStatus: 200 },
  );
  if (!Array.isArray(response?.permisos) || !response.permisos.every((permission) =>
    permission
    && typeof permission.vmid === 'number'
    && (permission.nivelAcceso === 'FULL_ACCESS' || permission.nivelAcceso === 'READ_ONLY'))) {
    throw new ApiRequestError('No se pudieron interpretar los permisos de instancias del usuario.');
  }
  return [...new Map(response.permisos.map((permission) => {
    const normalizedPermission: UserInstancePermission = {
      vmid: instanceVmid(permission.vmid),
      nivelAcceso: permission.nivelAcceso,
    };
    return [normalizedPermission.vmid, normalizedPermission];
  })).values()];
}

export async function assignUserInstances(userId: string, permissions: UserInstancePermission[]): Promise<void> {
  const normalizedPermissions = [...new Map(permissions.map((permission) => {
    const normalizedPermission: UserInstancePermission = {
      vmid: instanceVmid(permission.vmid),
      nivelAcceso: permission.nivelAcceso,
    };
    return [normalizedPermission.vmid, normalizedPermission];
  })).values()];
  await apiClient.request(`/admin/users/${encodeURIComponent(userId)}/permissions`, {
    method: 'PUT',
    payload: { permisos: normalizedPermissions },
    expectedStatus: 204,
  });
}
