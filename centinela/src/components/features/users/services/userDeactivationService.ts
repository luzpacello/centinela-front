import { apiClient } from '@/services/apiClient';

// La baja es lógica: desactiva la cuenta y revoca todas sus sesiones.
export async function deactivateUserAccount(userId: string): Promise<void> {
  await apiClient.request(`/admin/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE', expectedStatus: 204,
  });
}
