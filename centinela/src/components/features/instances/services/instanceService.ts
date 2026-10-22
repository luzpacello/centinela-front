import { ApiRequestError, apiClient } from '@/services/apiClient';
import type { InstanceActiveTask, InstancePowerActionResponse, InventoryInstance, InstancePowerAction, InstanceRef } from '../types/instance';
import type { CreateInstanceDraft, CreateInstancePayload, CreateInstanceResponse, OperatingSystemTemplateOption, StorageOption } from '../types/createInstance';
import { DEFAULT_NETWORK_CONFIGURATION, DEFAULT_RESOURCE_CONFIGURATION } from '../data/createInstanceOptions';
import { isValidStaticNetwork } from '../validation/createInstanceValidation';

export type { InventoryInstance, InstancePowerAction } from '../types/instance';

//mockInstances es en caso de que se necesite instancias de prueba espara alguna tarea
//const USE_INSTANCE_MOCKS = import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true';

function validateInstanceRef(ref: unknown): InstanceRef {
  if (typeof ref === 'string' && ref.trim()) return ref.trim();
  if (typeof ref === 'number' && Number.isSafeInteger(ref) && ref > 0) return ref;
  throw new ApiRequestError('La instancia no tiene una referencia válida.');
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

function formatCatalogBytes(bytes: number, allowMegabytes = false): string {
  const gigabytes = bytes / 1024 ** 3;
  if (allowMegabytes && gigabytes < 1) return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
  return gigabytes >= 1024
    ? `${(gigabytes / 1024).toFixed(2)} TB`
    : `${gigabytes.toFixed(2)} GB`;
}

export async function fetchCreationStorages(signal?: AbortSignal): Promise<StorageOption[]> {
  const response = await apiClient.get<unknown>('/node/storages', { signal, expectedStatus: 200 });
  if (!Array.isArray(response)) throw new ApiRequestError('No se pudo interpretar la lista de almacenamientos.');

  return response.map((value: unknown): StorageOption => {
    if (typeof value !== 'object' || value === null) throw new ApiRequestError('No se pudo interpretar la lista de almacenamientos.');
    const storage = value as Record<string, unknown>;
    if (typeof storage.name !== 'string' || typeof storage.type !== 'string'
      || typeof storage.freeBytes !== 'number' || !Number.isFinite(storage.freeBytes) || storage.freeBytes < 0
      || typeof storage.totalBytes !== 'number' || !Number.isFinite(storage.totalBytes) || storage.totalBytes < 0
      || !Array.isArray(storage.contentTypes) || !storage.contentTypes.every((contentType) => typeof contentType === 'string')) {
      throw new ApiRequestError('No se pudo interpretar la lista de almacenamientos.');
    }
    const availableLabel = formatCatalogBytes(storage.freeBytes);
    return {
      value: storage.name,
      label: `${storage.name} (${storage.type}) · ${availableLabel} libres`,
      availableGb: storage.freeBytes / 1024 ** 3,
      totalGb: storage.totalBytes / 1024 ** 3,
      availableLabel,
      totalLabel: formatCatalogBytes(storage.totalBytes),
      type: storage.type,
      contentTypes: storage.contentTypes,
    };
  });
}

export async function fetchCreationTemplates(signal?: AbortSignal): Promise<OperatingSystemTemplateOption[]> {
  const response = await apiClient.get<unknown>('/node/templates', { signal, expectedStatus: 200 });
  if (!Array.isArray(response)) throw new ApiRequestError('No se pudo interpretar la lista de imágenes.');

  return response.map((value: unknown): OperatingSystemTemplateOption => {
    if (typeof value !== 'object' || value === null) throw new ApiRequestError('No se pudo interpretar la lista de imágenes.');
    const template = value as Record<string, unknown>;
    if (typeof template.id !== 'string' || typeof template.name !== 'string'
      || (template.type !== 'ISO' && template.type !== 'LXC_TEMPLATE')
      || typeof template.sizeBytes !== 'number' || !Number.isFinite(template.sizeBytes) || template.sizeBytes < 0) {
      throw new ApiRequestError('No se pudo interpretar la lista de imágenes.');
    }
    return {
      value: template.id,
      label: template.name,
      type: template.type,
      templateName: template.name,
      distribution: template.type === 'ISO' ? 'ISO' : 'LXC',
      operatingSystem: '—',
      version: '—',
      size: formatCatalogBytes(template.sizeBytes, true),
      date: '—',
    };
  });
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
    if ((typeof instance.id !== 'string' && typeof instance.id !== 'number') || typeof instance.name !== 'string'
      || typeof instance.type !== 'string' || typeof instance.node !== 'string'
      || typeof instance.status !== 'string') {
      throw new ApiRequestError('No se pudo interpretar el inventario de instancias.');
    }
    const type = instance.type.toUpperCase();
    if (type !== 'VM' && type !== 'LXC') throw new ApiRequestError('El inventario contiene un tipo de instancia desconocido.');
    const inventoryInstance: InventoryInstance = {
      id: validateInstanceRef(instance.id), name: instance.name, type,
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

export async function requestInstancePowerAction(vmid: InstanceRef, action: InstancePowerAction): Promise<InstancePowerActionResponse> {
  const instanceRef = encodeURIComponent(validateInstanceRef(vmid));
  
  let endpoint: string;
  
  switch (action) {
    case 'start':
    case 'stop':
      endpoint = `/instances/${instanceRef}/${action}`;
      break;
    case 'shutdown':
    case 'reboot':
      endpoint = `/instances/${instanceRef}/status/${action}`;
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

export async function deleteInstance( vmid: InstanceRef ): Promise<InstancePowerActionResponse> {
  const response = await apiClient.request<InstancePowerActionResponse>(
    `/instances/${encodeURIComponent(validateInstanceRef(vmid))}`,
    { method: 'DELETE', expectedStatus: 202,},
  );

  if (!response || typeof response.tareaId !== 'string' || !response.tareaId.trim()) {
    throw new ApiRequestError('La eliminación fue aceptada, pero no se pudo interpretar su seguimiento.');
  }

  return response;
}

export function buildCreateInstancePayload(draft: CreateInstanceDraft): CreateInstancePayload {
  if (!draft.tipo || !draft.nombre.trim() || !draft.templateOso || !draft.storageId.trim()) {
    throw new ApiRequestError('Revisá los datos generales y seleccioná un almacenamiento y un sistema operativo antes de crear la instancia.');
  }

  const cores = draft.cores ?? DEFAULT_RESOURCE_CONFIGURATION.cores;
  const ramMb = draft.ramMb ?? DEFAULT_RESOURCE_CONFIGURATION.ramMb;
  const discoGb = draft.discoGb ?? DEFAULT_RESOURCE_CONFIGURATION.discoGb;
  if (![cores, ramMb, discoGb].every((value) => Number.isSafeInteger(value) && value > 0)) {
    throw new ApiRequestError('Los recursos de CPU, memoria y disco deben ser números enteros positivos.');
  }

  const networkMode = draft.red.modo ?? DEFAULT_NETWORK_CONFIGURATION.modo;
  const usesStaticIp = networkMode === 'static';
  if (usesStaticIp && !isValidStaticNetwork(draft.red)) {
    throw new ApiRequestError('Ingresá una IP IPv4 válida, un prefijo CIDR entre 0 y 32 y una puerta de enlace válida.');
  }

  return {
    cores,
    descripcion: draft.descripcion.trim(),
    discoGb,
    nombre: draft.nombre.trim(),
    password: draft.password,
    ramMb,
    red: {
      firewall: draft.red.firewall ?? false,
      gateway: usesStaticIp ? draft.red.gateway.trim() : '',
      ip: usesStaticIp ? `${draft.red.ip.trim()}/${draft.red.mascara.trim()}` : '',
      mascara: usesStaticIp ? draft.red.mascara.trim() : '',
      modo: networkMode,
      vlan: draft.red.vlan ?? 0,
    },
    storageId: draft.storageId.trim(),
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
  if ((typeof creation.vmid !== 'number' && typeof creation.vmid !== 'string')
    || typeof creation.tareaId !== 'string'
    || !creation.tareaId.trim()) {
    throw new ApiRequestError('La creación fue aceptada, pero no se pudo interpretar su seguimiento.');
  }

  let vmid: InstanceRef;
  try {
    vmid = validateInstanceRef(creation.vmid);
  } catch {
    throw new ApiRequestError('La creación fue aceptada, pero no se pudo interpretar su seguimiento.');
  }

  return {
    vmid,
    tareaId: creation.tareaId,
  };
}
