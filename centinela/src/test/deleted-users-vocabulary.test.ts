import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

vi.mock('@/services/apiClient', () => ({
  apiClient: { get: vi.fn() },
  ApiRequestError: class ApiRequestError extends Error {
    status?: number;

    constructor(message = '', status?: number) {
      super(message);
      this.status = status;
    }
  },
}));

vi.mock('@/components/features/users/services/userDetailsService', () => ({
  fetchUserDetails: vi.fn(async (id: string) => ({ id, nombreCompleto: `Usuario ${id.slice(0, 4)}`, eliminadoEn: '2026-10-01T00:00:00Z' })),
}));

import { apiClient } from '@/services/apiClient';
import { fetchDeletedUsers } from '@/components/features/users/services/deletedUsersService';

const getMock = apiClient.get as unknown as Mock;

const NUEVA = '11111111-1111-4111-8111-111111111111';
const HISTORICA = '22222222-2222-4222-8222-222222222222';

beforeEach(() => {
  getMock.mockReset();
});

describe('Historial de usuarios eliminados', () => {
  it('incluye las bajas nuevas y las históricas sin exigir el código viejo en la consulta', async () => {
    getMock.mockResolvedValue({
      total: 2,
      pagina: 1,
      items: [
        { accion: 'ELIMINAR_USUARIO', resultado: 'SUCCESS', detalles: JSON.stringify({ usuarioEliminado: NUEVA }) },
        { accion: 'ELIMINAR_USUARIO', resultado: 'EXITO', detalles: JSON.stringify({ usuarioEliminado: HISTORICA }) },
        { accion: 'ELIMINAR_USUARIO', resultado: 'FAILED', detalles: JSON.stringify({ usuarioEliminado: NUEVA }) },
      ],
    });

    const eliminados = await fetchDeletedUsers();

    expect(eliminados.map((user) => user.id).sort()).toEqual([HISTORICA, NUEVA].sort());
    const url = String(getMock.mock.calls[0][0]);
    expect(url).toContain('accion=ELIMINAR_USUARIO');
    expect(url).not.toContain('resultado=EXITO');
  });
});
