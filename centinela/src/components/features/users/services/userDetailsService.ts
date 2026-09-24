import { ApiRequestError, apiClient } from '@/services/apiClient';
import type { UserDetails } from '../types/user';

interface FetchUserDetailsOptions {
  isCurrentUser?: boolean;
  signal?: AbortSignal;
}

interface UserDetailsResponse extends Omit<UserDetails, 'instanciasPermitidas'> {
  instanciasPermitidas: Array<string | number> | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringOrNull(value: unknown): value is string | null {
  return typeof value === 'string' || value === null;
}

function isUserDetailsResponse(value: unknown): value is UserDetailsResponse {
  if (!isRecord(value)) return false;
  const instances = value.instanciasPermitidas;

  return typeof value.id === 'string'
    && typeof value.nombreCompleto === 'string'
    && typeof value.nombreUsuario === 'string'
    && typeof value.emailUsuario === 'string'
    && typeof value.organizacionId === 'string'
    && typeof value.rol === 'string'
    && typeof value.activo === 'boolean'
    && typeof value.totpVinculado === 'boolean'
    && typeof value.cambioContrasenaRequerido === 'boolean'
    && typeof value.fechaCreacion === 'string'
    && isStringOrNull(value.fechaUltimoAcceso)
    && (instances === null || (
      Array.isArray(instances)
      && instances.every((instance) => typeof instance === 'string' || typeof instance === 'number')
    ));
}

export async function fetchUserDetails(
  userId: string,
  { signal }: FetchUserDetailsOptions = {},
): Promise<UserDetails> {
  const path = `/admin/users/${encodeURIComponent(userId)}`;
  const response = await apiClient.get<unknown>(path, { signal, expectedStatus: 200 });

  if (!isUserDetailsResponse(response)) {
    throw new ApiRequestError('No se pudo interpretar la información del usuario.');
  }
  if (response.id !== userId) {
    throw new ApiRequestError('La respuesta no corresponde al usuario seleccionado.');
  }

  return {
    ...response,
    instanciasPermitidas: response.instanciasPermitidas ?? [],
  };
}

export async function updateUserDetails(
  userId: string,
  data: Partial<Pick<UserDetails, 'activo' | 'emailUsuario' | 'nombreCompleto' | 'rol'>>,
): Promise<UserDetails> {
  const response = await apiClient.request<unknown>(`/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PUT', payload: data, expectedStatus: 200,
  });
  if (isUserDetailsResponse(response) && response.id === userId) {
    return { ...response, instanciasPermitidas: response.instanciasPermitidas ?? [] };
  }
  // El PUT devuelve un resumen: consultar el detalle completo sin inventar los campos faltantes.
  if (!isRecord(response) || response.id !== userId
    || typeof response.nombreCompleto !== 'string' || typeof response.emailUsuario !== 'string'
    || typeof response.rol !== 'string' || typeof response.activo !== 'boolean') {
    throw new ApiRequestError('No se pudo interpretar la respuesta de actualización del usuario.');
  }
  return fetchUserDetails(userId);
}
