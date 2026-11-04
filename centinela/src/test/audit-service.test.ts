import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exportAuditLogs } from '@/components/features/audit/services/auditService';

vi.mock('@/storage/tokenStorage', () => ({
    getAccessToken: () => 'audit-test-token',
}));

describe('exportAuditLogs', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    it('envía formato y filtros activos y toma el nombre de Content-Disposition', async () => {
        const blob = new Blob(['audit data'], { type: 'text/csv' });
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            headers: new Headers({
                'Content-Disposition': "attachment; filename*=UTF-8''auditoria%20completa.csv",
            }),
            blob: async () => blob,
        } as Response);

        const result = await exportAuditLogs({
            desde: '2026-10-01',
            hasta: '2026-10-31',
            usuarioId: 'user-12',
            accion: 'LOGIN',
            recursoTipo: 'VM',
            resultado: 'FALLA',
            excluirAccion: ['INTERNAL_A', 'INTERNAL_B'],
        }, 'csv');

        const [requestUrl, requestOptions] = vi.mocked(fetch).mock.calls[0];
        const url = new URL(String(requestUrl), 'http://localhost');
        expect(url.pathname).toBe('/api/admin/audit/export');
        expect(url.searchParams.get('format')).toBe('csv');
        expect(url.searchParams.get('desde')).toBe('2026-10-01');
        expect(url.searchParams.get('hasta')).toBe('2026-10-31');
        expect(url.searchParams.get('usuarioId')).toBe('user-12');
        expect(url.searchParams.get('accion')).toBe('LOGIN');
        expect(url.searchParams.get('recursoTipo')).toBe('VM');
        expect(url.searchParams.get('resultado')).toBe('FALLA');
        expect(url.searchParams.getAll('excluirAccion')).toEqual(['INTERNAL_A', 'INTERNAL_B']);
        expect(requestOptions).toEqual({
            headers: { Authorization: 'Bearer audit-test-token' },
            credentials: 'include',
        });
        expect(result).toEqual({ blob, filename: 'auditoria completa.csv' });
    });

    it('aplica un nombre canónico con extensión JSON cuando el backend no sugiere uno', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            headers: new Headers(),
            blob: async () => new Blob(['{}'], { type: 'application/json' }),
        } as Response);

        await expect(exportAuditLogs({}, 'json')).resolves.toMatchObject({
            filename: expect.stringMatching(/^auditoria_centinela_\d{8}_\d{4}\.json$/),
        });
        expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('format=json');
    });

    it('rechaza respuestas HTTP no exitosas', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: false,
            status: 403,
            json: async () => ({ message: 'Sin permisos para exportar.' }),
        } as Response);

        await expect(exportAuditLogs({}, 'csv')).rejects.toMatchObject({
            message: 'Sin permisos para exportar.',
            status: 403,
        });
    });
});
