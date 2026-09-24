import { ApiRequestError, apiClient } from '@/services/apiClient';
import type { CreateUserPayload, CreateUserResponse } from '../types/createUser';

export async function createUser(data: CreateUserPayload): Promise<CreateUserResponse> {
  try {
    const response = await apiClient.post<CreateUserResponse>('/admin/users', data, { expectedStatus: 201 });
    if (!response || typeof response.id !== 'string' || typeof response.rol !== 'string' || typeof response.activo !== 'boolean') {
      throw new ApiRequestError('No se pudo interpretar el usuario creado.');
    }
    return { id: response.id, rol: response.rol, activo: response.activo };
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 502 && error.errorCode === 'EMAIL_DELIVERY_FAILED') {
      throw new ApiRequestError('No se pudo enviar el correo de activación; el usuario no fue dado de alta.', 502, error.errorCode);
    }
    throw error;
  }
}
