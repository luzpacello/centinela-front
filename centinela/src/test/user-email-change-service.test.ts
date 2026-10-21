import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requestAccountEmailChange } from '@/components/features/users/services/userDetailsService';
import { apiClient } from '@/services/apiClient';

describe('requestAccountEmailChange', () => {
  beforeEach(() => {
    vi.spyOn(apiClient, 'request').mockResolvedValue({});
  });

  it('envía el correo y las credenciales de reautenticación a PUT /account/profile', async () => {
    await requestAccountEmailChange('nuevo@example.com', 'clave-actual', '123456');

    expect(apiClient.request).toHaveBeenCalledWith('/account/profile', {
      method: 'PUT',
      payload: {
        emailUsuario: 'nuevo@example.com',
        contrasenaActual: 'clave-actual',
        codigo2fa: '123456',
      },
      expectedStatus: 200,
      allowEmptyResponse: true,
      preserveSessionOnReauthFailure: true,
    });
  });
});
