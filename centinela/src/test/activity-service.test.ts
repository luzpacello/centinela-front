import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/services/apiClient';
import { getRecentActivity } from '@/components/features/dashboard/services/activityService';

vi.mock('@/services/apiClient', () => ({
    apiClient: { get: vi.fn() },
}));

// El feed "Actividad reciente" pide la auditoría al backend. La consulta tiene
// que excluir el ruido del canal de eventos en el servidor: si solo se filtrara
// en el cliente, los registros de conexión seguirían ocupando la ventana y el
// panel quedaría vacío, que es el defecto reportado.
describe('activityService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(apiClient.get).mockResolvedValue({ items: [] } as never);
    });

    function parametrosDeLaConsulta(): URLSearchParams {
        const [url] = vi.mocked(apiClient.get).mock.calls[0];
        return new URLSearchParams(String(url).split('?')[1] ?? '');
    }

    it('pide al backend que excluya conexión y cierre del canal de eventos', async () => {
        await getRecentActivity();

        const excluidas = parametrosDeLaConsulta().get('excluirAccion') ?? '';
        expect(excluidas).toContain('EVENTOS_CONEXION');
        expect(excluidas).toContain('EVENTOS_CIERRE');
    });

    it('sigue ordenando por fecha descendente y pidiendo la primera página', async () => {
        await getRecentActivity();

        const parametros = parametrosDeLaConsulta();
        expect(parametros.get('pagina')).toBe('1');
        expect(parametros.get('ordenarPor')).toBe('fechaHora');
        expect(parametros.get('direccion')).toBe('desc');
    });

    it('deja afuera del feed los eventos de conexión que igual lleguen', async () => {
        vi.mocked(apiClient.get).mockResolvedValue({
            items: [
                { id: 'ruido', accion: 'EVENTOS_CONEXION' },
                { id: 'real', accion: 'LOGIN' },
            ],
        } as never);

        const pagina = await getRecentActivity();

        expect(pagina.items?.map((item) => item.id)).toEqual(['real']);
    });

    it('muestra una sola fila por acción y conserva el resultado final', async () => {
        vi.mocked(apiClient.get).mockResolvedValue({
            items: [
                { id: 'despacho', accion: 'INICIAR_VM', resultado: 'PENDIENTE' },
                { id: 'resultado', accion: 'INICIAR_VM', resultado: 'SUCCESS' },
            ],
        } as never);

        const pagina = await getRecentActivity();

        expect(pagina.items?.map((item) => item.id)).toEqual(['resultado']);
    });

    it('no deja que los despachos pendientes ocupen los cinco lugares del panel', async () => {
        const pendientes = Array.from({ length: 5 }, (_, index) => ({
            id: `pendiente-${index}`,
            accion: 'APAGAR_VM',
            resultado: 'PENDIENTE',
        }));
        const resultados = Array.from({ length: 5 }, (_, index) => ({
            id: `resultado-${index}`,
            accion: 'APAGAR_VM',
            resultado: 'SUCCESS',
        }));
        vi.mocked(apiClient.get).mockResolvedValue({ items: [...pendientes, ...resultados] } as never);

        const pagina = await getRecentActivity();

        expect(pagina.items?.map((item) => item.id)).toEqual([
            'resultado-0',
            'resultado-1',
            'resultado-2',
            'resultado-3',
            'resultado-4',
        ]);
    });
});
