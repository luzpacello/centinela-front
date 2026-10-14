import { ApiRequestError, apiClient } from '@/services/apiClient';

export interface UserRecentActivity {
  id: string;
  usuarioId?: string | null;
  accion: string;
  fechaHora?: string | null;
  resultado?: string | null;
}

export async function fetchUserRecentActivity(userId: string, signal?: AbortSignal): Promise<UserRecentActivity[]> {
  const params = new URLSearchParams({
    usuarioId: userId,
    pagina: '1',
    tamano: '5',
    ordenarPor: 'fechaHora',
    direccion: 'desc',
  });
  const response = await apiClient.get<{ items?: UserRecentActivity[] }>(
    `/admin/audit?${params.toString()}`,
    { signal, expectedStatus: 200 },
  );
  if (!Array.isArray(response?.items)) {
    throw new ApiRequestError('No se pudo interpretar la actividad reciente del usuario.');
  }
  return response.items.filter((item) => item
    && typeof item.id === 'string'
    && typeof item.accion === 'string'
    && item.accion.trim()
    && (item.usuarioId == null || item.usuarioId === userId));
}
