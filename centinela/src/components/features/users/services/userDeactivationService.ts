import { apiClient } from '@/services/apiClient';

// La eliminación es irreversible: conserva el historial, libera el correo y revoca las sesiones.
export async function deleteUserAccount(userId: string): Promise<void> {
  await apiClient.request(`/admin/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE', expectedStatus: 204,
  });
}
