import type { InstancePowerAction } from '@/components/features/instances/types/instance';

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? value as Record<string, unknown>
    : null;
}

function readErrorDetails(error: unknown): { status?: number; errorCode?: string; message?: string } {
  const root = asRecord(error);
  const response = asRecord(root?.response);
  const responseData = asRecord(response?.data);
  const status = typeof root?.status === 'number'
    ? root.status
    : typeof response?.status === 'number'
      ? response.status
      : undefined;
  const errorCode = [
    root?.errorCode,
    root?.code,
    responseData?.errorCode,
    responseData?.code,
    response?.errorCode,
    response?.code,
  ].find((value): value is string => typeof value === 'string');
  const message = typeof root?.message === 'string' ? root.message : undefined;

  return { status, errorCode, message };
}

export function getErrorMessage(error: unknown, action?: InstancePowerAction): string {
  const { status, errorCode, message } = readErrorDetails(error);

  if (status === 409 && errorCode === 'INSTANCE_INVALID_STATE') {
    return action === 'start'
      ? 'La instancia ya está encendida'
      : 'El estado actual no corresponde a la acción';
  }
  if (status === 409 && errorCode === 'INSTANCE_BUSY') {
    return 'La instancia se encuentra ejecutando otra tarea. Aguarde a que finalice.';
  }
  if (status === 403 && errorCode === 'INSTANCE_PROTECTED') {
    return 'La instancia pertenece a infraestructura protegida y no puede ser modificada.';
  }
  if (status === 403 && errorCode === 'INSTANCE_ACCESS_DENIED') {
    return 'No posee permisos suficientes para operar sobre esta instancia.';
  }
  if (status === 502 && errorCode === 'PROXMOX_UNAVAILABLE') {
    return 'El hipervisor Proxmox no está disponible.';
  }
  if (status === 504 && errorCode === 'PROXMOX_TIMEOUT') {
    return 'La respuesta de Proxmox agotó el tiempo de espera.';
  }

  return typeof error === 'string'
    ? error
    : message || 'Ocurrió un error inesperado al procesar la operación.';
}
