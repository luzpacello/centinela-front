import { ApiRequestError, apiClient } from '@/services/apiClient';
import type { InstanceActiveTask, InstancePowerActionResponse, InventoryInstance, InstancePowerAction } from '../types/instance';
import type { CreateInstanceDraft, CreateInstancePayload, CreateInstanceResponse } from '../types/createInstance';
import { DEFAULT_NETWORK_CONFIGURATION, DEFAULT_RESOURCE_CONFIGURATION } from '../data/createInstanceOptions';

export type { InventoryInstance, InstancePowerAction } from '../types/instance';

//mockInstances es en caso de que se necesite instancias de prueba espara alguna tarea
//const USE_INSTANCE_MOCKS = import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true';

function validateInstanceVmid(vmid: number): number {
  if (!Number.isSafeInteger(vmid) || vmid <= 0) {
    throw new ApiRequestError('La instancia no tiene un VMID válido.');
  }
  return vmid;
}

function readOptionalTelemetry(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

function readOptionalActiveTask(value: unknown): InstanceActiveTask | null {
  if (typeof value !== 'object' || value === null) return null;
  const task = value as Record<string, unknown>;
  if (typeof task.tareaId !== 'string' || typeof task.action !== 'string' || typeof task.status !== 'string') return null;
  return { tareaId: task.tareaId, action: task.action, status: task.status.toUpperCase() };
}

export async function fetchInstanceInventory(signal?: AbortSignal): Promise<InventoryInstance[]> {
  {/*if (USE_INSTANCE_MOCKS) {
    if (signal?.aborted) {
      throw new DOMException('Operación cancelada', 'AbortError');
    }
    return mockInstances.map((instance) => ({ ...instance }));
  }*/}
  const response = await apiClient.get<unknown>('/instances', { signal, expectedStatus: 200 });
  if (!Array.isArray(response)) throw new ApiRequestError('No se pudo interpretar el inventario de instancias.');
  return response.map((value: unknown): InventoryInstance => {
    if (typeof value !== 'object' || value === null) throw new ApiRequestError('No se pudo interpretar el inventario de instancias.');
    const instance = value as Record<string, unknown>;
    if (typeof instance.id !== 'number' || typeof instance.name !== 'string'
      || typeof instance.type !== 'string' || typeof instance.node !== 'string'
      || typeof instance.status !== 'string') {
      throw new ApiRequestError('No se pudo interpretar el inventario de instancias.');
    }
    const type = instance.type.toUpperCase();
    if (type !== 'VM' && type !== 'LXC') throw new ApiRequestError('El inventario contiene un tipo de instancia desconocido.');
    const inventoryInstance: InventoryInstance = {
      id: validateInstanceVmid(instance.id), name: instance.name, type,
      node: instance.node, status: instance.status.toLowerCase(),
    };
    // Los campos extendidos son opcionales: un inventario antiguo sigue siendo válido.
    if ('ip' in instance) inventoryInstance.ip = typeof instance.ip === 'string' && instance.ip.trim() ? instance.ip.trim() : null;
    if ('cpuUsage' in instance) inventoryInstance.cpuUsage = readOptionalTelemetry(instance.cpuUsage);
    if ('ramUsage' in instance) inventoryInstance.ramUsage = readOptionalTelemetry(instance.ramUsage);
    if ('maxRam' in instance) inventoryInstance.maxRam = readOptionalTelemetry(instance.maxRam);
    if ('activeTask' in instance) inventoryInstance.activeTask = readOptionalActiveTask(instance.activeTask);
    if ('nivelAcceso' in instance) {
      inventoryInstance.nivelAcceso = instance.nivelAcceso === 'FULL_ACCESS' || instance.nivelAcceso === 'READ_ONLY'
        ? instance.nivelAcceso : null;
    }
    return inventoryInstance;
  });
}

export async function requestInstancePowerAction(vmid: number, action: InstancePowerAction): Promise<InstancePowerActionResponse> {
  const validVmid = validateInstanceVmid(vmid)
  
  let endpoint: string;
  
  switch (action) {
    case 'start':
    case 'stop':
      endpoint = `/instances/${validVmid}/${action}`;
      break;
    case 'shutdown':
    case 'reboot':
      endpoint = `/instances/${validVmid}/status/${action}`;
      break;
    default:
      throw new ApiRequestError('La acción de instancia no es válida.');
  }

  const response = await apiClient.request<InstancePowerActionResponse>(endpoint, {
    method: 'POST', expectedStatus: 202,
  });

  // El backend expone el identificador público de la tarea; el UPID de Proxmox
  // queda privado. Sin tareaId no hay forma de correlacionar el TASK_FINISHED.
  if (!response || typeof response.tareaId !== 'string' || !response.tareaId.trim()) {
    throw new ApiRequestError('La orden fue aceptada, pero no se pudo interpretar su seguimiento. Verificá el estado de la instancia antes de repetirla.');
  }

  return response;
}

export async function deleteInstance( vmid: number ): Promise<InstancePowerActionResponse> {
  const response = await apiClient.request<InstancePowerActionResponse>(
    `/instances/${validateInstanceVmid(vmid)}`,
    { method: 'DELETE', expectedStatus: 202,},
  );

  if (!response || typeof response.tareaId !== 'string' || !response.tareaId.trim()) {
    throw new ApiRequestError('La eliminación fue aceptada, pero no se pudo interpretar su seguimiento.');
  }

  return response;
}

export function buildCreateInstancePayload(draft: CreateInstanceDraft): CreateInstancePayload {
  if (!draft.tipo || !draft.nombre.trim() || !draft.nodo || !draft.templateOso) {
    throw new ApiRequestError('Revisá los datos generales y seleccioná un sistema operativo antes de crear la instancia.');
  }

  const networkMode = draft.red.modo ?? DEFAULT_NETWORK_CONFIGURATION.modo;
  const usesStaticIp = networkMode === 'static';
  if (usesStaticIp && (!draft.red.ip.trim() || !draft.red.mascara.trim() || !draft.red.gateway.trim())) {
    throw new ApiRequestError('Completá la dirección IP, el prefijo de red y la puerta de enlace.');
  }

  return {
    cores: draft.cores ?? DEFAULT_RESOURCE_CONFIGURATION.cores,
    descripcion: draft.descripcion.trim(),
    discoGb: draft.discoGb ?? DEFAULT_RESOURCE_CONFIGURATION.discoGb,
    nodo: draft.nodo,
    nombre: draft.nombre.trim(),
    password: draft.password,
    ramMb: draft.ramMb ?? DEFAULT_RESOURCE_CONFIGURATION.ramMb,
    red: {
      bridge: draft.red.bridge || DEFAULT_NETWORK_CONFIGURATION.bridge,
      firewall: draft.red.firewall ?? false,
      gateway: usesStaticIp ? draft.red.gateway.trim() : '',
      ip: usesStaticIp ? draft.red.ip.trim() : '',
      mascara: usesStaticIp ? draft.red.mascara.trim() : '',
      modo: networkMode,
      vlan: draft.red.vlan ?? 0,
    },
    storageId: draft.storageId || DEFAULT_RESOURCE_CONFIGURATION.storageId,
    templateOso: draft.templateOso,
    tipo: draft.tipo,
  };
}

export async function createInstance(payload: CreateInstancePayload): Promise<CreateInstanceResponse> {
  const response = await apiClient.post<unknown>('/instances', payload, { expectedStatus: 202 });

  if (typeof response !== 'object' || response === null) {
    throw new ApiRequestError('La creación fue aceptada, pero no se pudo interpretar su seguimiento.');
  }

  const creation = response as Record<string, unknown>;
  // La creación también responde con el tareaId público; el UPID no se expone.
  if (typeof creation.vmid !== 'number'
    || typeof creation.tareaId !== 'string'
    || !creation.tareaId.trim()) {
    throw new ApiRequestError('La creación fue aceptada, pero no se pudo interpretar su seguimiento.');
  }

  return {
    vmid: creation.vmid,
    tareaId: creation.tareaId,
  };
}
