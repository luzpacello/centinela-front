import { apiClient } from "@/services/apiClient";

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

export const snapshotService = {
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