import { ApiRequestError, apiClient } from '@/services/apiClient';
import type { UserDetails } from '../types/user';
import { fetchUserDetails } from './userDetailsService';

const AUDIT_PAGE_SIZE = 200;
const DETAIL_REQUEST_BATCH_SIZE = 4;
const USER_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function fetchDeletedUsers(signal?: AbortSignal): Promise<UserDetails[]> {
  const deletedUserIds = new Set<string>();
  let pageNumber = 1;
  let totalRecords: number;

  // El listado de usuarios omite las bajas: la auditoría identifica las cuentas
  // y el detalle confirma su estado actual, sin confundir al administrador que las eliminó.
  do {
    signal?.throwIfAborted();
    const query = new URLSearchParams({
      accion: 'ELIMINAR_USUARIO', resultado: 'EXITO', pagina: String(pageNumber),
      tamano: String(AUDIT_PAGE_SIZE), ordenarPor: 'fechaHora', direccion: 'desc',
    });
    const response = await apiClient.get<unknown>(`/admin/audit?${query}`, { signal, expectedStatus: 200 });
    if (!isRecord(response) || !Array.isArray(response.items)
      || typeof response.total !== 'number' || !Number.isSafeInteger(response.total) || response.total < 0
      || response.pagina !== pageNumber || (response.items.length === 0 && response.total > (pageNumber - 1) * AUDIT_PAGE_SIZE)) {
      throw new ApiRequestError('No se pudo interpretar el historial de usuarios eliminados.');
    }
    totalRecords = response.total;
    for (const entry of response.items) {
      if (!isRecord(entry) || entry.accion !== 'ELIMINAR_USUARIO' || entry.resultado !== 'EXITO') continue;
      let details: unknown;
      try {
        details = typeof entry.detalles === 'string' ? JSON.parse(entry.detalles) : null;
      } catch {
        throw new ApiRequestError('No se pudo identificar una cuenta del historial de eliminaciones.');
      }
      if (!isRecord(details) || typeof details.usuarioEliminado !== 'string' || !USER_ID_PATTERN.test(details.usuarioEliminado)) {
        throw new ApiRequestError('No se pudo identificar una cuenta del historial de eliminaciones.');
      }
      deletedUserIds.add(details.usuarioEliminado);
    }
    pageNumber += 1;
  } while ((pageNumber - 1) * AUDIT_PAGE_SIZE < totalRecords);

  const deletedUsers: UserDetails[] = [];
  const userIds = [...deletedUserIds];
  // Limitar las consultas simultáneas para no saturar la API con historiales extensos.
  for (let index = 0; index < userIds.length; index += DETAIL_REQUEST_BATCH_SIZE) {
    signal?.throwIfAborted();
    const results = await Promise.allSettled(userIds.slice(index, index + DETAIL_REQUEST_BATCH_SIZE).map(async (userId) => {
      try {
        return await fetchUserDetails(userId, { signal });
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 404) return null;
        throw error;
      }
    }));
    signal?.throwIfAborted();
    for (const result of results) {
      if (result.status === 'rejected') throw result.reason;
      if (result.value?.eliminadoEn != null) deletedUsers.push(result.value);
    }
  }
  return deletedUsers;
}
