import { ApiRequestError, apiClient } from '@/services/apiClient';
import { instanceVmid } from '@/components/features/users/services/userInstanceService';

export interface InventoryInstance {
  id: number;
  name: string;
  type: 'VM' | 'LXC';
  node: string;
  status: string;
}

export type InstancePowerAction = 'start' | 'stop';

interface InstancePowerActionResponse {
  upid: string;
  tareaId?: string;
}

export async function fetchInstanceInventory(signal?: AbortSignal): Promise<InventoryInstance[]> {
  const response = await apiClient.get<unknown>('/instances', { signal, expectedStatus: 200 });
  if (!Array.isArray(response)) {
    throw new ApiRequestError('No se pudo interpretar el inventario de instancias.');
  }
  return response.map((instance) => {
    if (!instance || typeof instance.id !== 'number' || typeof instance.name !== 'string'
      || typeof instance.type !== 'string' || typeof instance.node !== 'string'
      || typeof instance.status !== 'string') {
      throw new ApiRequestError('No se pudo interpretar el inventario de instancias.');
    }
    const type = instance.type.toUpperCase();
    if (type !== 'VM' && type !== 'LXC') {
      throw new ApiRequestError('El inventario contiene un tipo de instancia desconocido.');
    }
    return { id: instanceVmid(instance.id), name: instance.name, type, node: instance.node, status: instance.status };
  });
}

export async function requestInstancePowerAction(vmid: number, action: InstancePowerAction): Promise<InstancePowerActionResponse> {
  if (action !== 'start' && action !== 'stop') {
    throw new ApiRequestError('La acción de instancia no es válida.');
  }
  const response = await apiClient.request<InstancePowerActionResponse>(`/instances/${instanceVmid(vmid)}/${action}`, {
    method: 'POST', expectedStatus: 202,
  });
  if (!response || typeof response.upid !== 'string' || !response.upid.trim()) {
    throw new ApiRequestError('La orden fue aceptada, pero no se pudo interpretar su seguimiento. Verificá el estado de la instancia antes de repetirla.');
  }
  return response;
}
