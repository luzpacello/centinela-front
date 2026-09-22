import { ApiRequestError, apiClient } from '@/services/apiClient';

export interface UserInstance {
  id: string;
  name: string;
  type: 'VM' | 'LXC';
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
  const response = await apiClient.get<{ instances: UserInstance[] }>('/instances', {
    signal, expectedStatus: 200,
  });
  if (!Array.isArray(response?.instances) || !response.instances.every((instance) =>
    instance && typeof instance.id === 'string' && typeof instance.name === 'string'
    && (instance.type === 'VM' || instance.type === 'LXC'))) {
    throw new ApiRequestError('No se pudo interpretar el inventario de instancias.');
  }
  response.instances.forEach((instance) => instanceVmid(instance.id));
  return response.instances;
}

export async function assignUserInstances(userId: string, vmids: number[]): Promise<void> {
  await apiClient.request(`/admin/users/${encodeURIComponent(userId)}/instances`, {
    method: 'PUT',
    payload: { vmids: [...new Set(vmids.map(instanceVmid))] },
    expectedStatus: 204,
  });
}
