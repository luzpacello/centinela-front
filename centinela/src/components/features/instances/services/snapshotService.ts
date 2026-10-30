import { apiClient, ApiRequestError } from "@/services/apiClient";

export interface SnapshotItem {
  name: string;
  snaptime?: number | string;
  createdAt?: number | string;
  description?: string;
  parent?: string;
}

export interface CreateSnapshotPayload {
  snapname: string;
  description?: string;
}

export interface CreateSnapshotResponse {
  tareaId: string;
  snapname: string;
}

async function requestSnapshotAction(instanceRef: string | number, snapshotName: string, action: 'rollback' | 'delete'): Promise<{ tareaId: string }> {
  const path = `/instances/${encodeURIComponent(String(instanceRef))}/snapshots/${encodeURIComponent(snapshotName)}`;
  const response = await apiClient.request<unknown>(action === 'rollback' ? `${path}/rollback` : path, {
    method: action === 'rollback' ? 'POST' : 'DELETE', expectedStatus: 202,
  });
  if (typeof response !== 'object' || response === null || typeof (response as { tareaId?: unknown }).tareaId !== 'string' || !(response as { tareaId: string }).tareaId.trim()) {
    throw new ApiRequestError('La solicitud fue aceptada sin identificador de seguimiento. Verificá el estado antes de reintentar.');
  }
  return { tareaId: (response as { tareaId: string }).tareaId };
}

export const snapshotService = {
  rollbackSnapshot: (instanceRef: string | number, snapshotName: string) => requestSnapshotAction(instanceRef, snapshotName, 'rollback'),
  deleteSnapshot: (instanceRef: string | number, snapshotName: string) => requestSnapshotAction(instanceRef, snapshotName, 'delete'),
  /**
   * Obtiene la lista cronológica de snapshots para la instancia solicitada.
   * GET /api/instances/:instanceRef/snapshots
   */
  async getSnapshots(instanceRef: string | number): Promise<SnapshotItem[]> {
    return apiClient.get<SnapshotItem[]>(`/instances/${instanceRef}/snapshots`);
  },

  /**
   * Dispara la creación de un nuevo snapshot.
   * POST /api/instances/:instanceRef/snapshots (Devuelve HTTP 202 Accepted con { tareaId, snapname })
   */
  async createSnapshot(
    instanceRef: string | number,
    payload: CreateSnapshotPayload
  ): Promise<CreateSnapshotResponse> {
    return apiClient.post<CreateSnapshotResponse>(`/instances/${instanceRef}/snapshots`, payload);
  },
};
