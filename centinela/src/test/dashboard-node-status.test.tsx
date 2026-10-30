import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

const authState = vi.hoisted(() => ({ role: 'ADMIN' as 'ADMIN' | 'OPERATOR' }));

// Los componentes se suscriben al canal por tipo; el test guarda los callbacks
// registrados para poder emitir el evento a mano.
const eventChannel = vi.hoisted(() => ({
    filters: [] as Array<{ tipo?: string; recursoId?: string | number }>,
    callbacks: [] as Array<(event: Record<string, unknown>) => void>,
}));

vi.mock('@/context/EventsContext', () => ({
    useEventsContext: () => ({ estado: 'open', ultimoMensaje: null, error: null, motivoCierre: null }),
    useEventSubscription: (
        filter: { tipo?: string; recursoId?: string | number },
        callback: (event: Record<string, unknown>) => void,
    ) => {
        eventChannel.filters.push(filter);
        eventChannel.callbacks.push(callback);
    },
}));

vi.mock('@/context/AuthContext', () => ({
    useAuth: () => ({
        user: { rol: authState.role },
        hasRole: (role: string) => authState.role === role,
        isAdmin: () => authState.role === 'ADMIN',
        isOperator: () => authState.role === 'OPERATOR',
        canAccessInstance: () => true,
        canOperateInstance: () => true,
    }),
}));

vi.mock('@/services/apiClient', () => ({
    apiClient: { get: vi.fn(), request: vi.fn() },
    ApiRequestError: class ApiRequestError extends Error {
        status?: number;
        constructor(message: string, status?: number) {
            super(message);
            this.status = status;
        }
    },
}));

vi.mock('@/components/features/dashboard/services/nodeStatusService', () => ({
    getNodeStatus: vi.fn(),
    getNodeHistory: vi.fn(),
}));

import {
    getNodeHistory,
    getNodeStatus,
    type NodeHistoryPoint,
    type NodeStatusResponse,
} from '@/components/features/dashboard/services/nodeStatusService';
import { ApiRequestError, apiClient } from '@/services/apiClient';
import { PendingInstanceCreationsProvider } from '@/components/features/instances/context/PendingInstanceCreationsContext';
import Dashboard from '@/pages/Dashboard';

const getMock = apiClient.get as unknown as Mock;

const status: NodeStatusResponse = {
    cpu: { usagePercent: 37.5, cores: 16 },
    ram: { usedGb: 42.25, totalGb: 128, usagePercent: 33.01 },
    storage: { usedGb: 75, totalGb: 128, usagePercent: 70 },
    uptimeSeconds: 86400,
    instancesSummary: {
        vms: { running: 6, stopped: 2, paused: 1, total: 9 },
        lxc: { running: 6, stopped: 2, paused: 1, total: 9 },
    },
    stale: false,
    fetchedAt: '2026-10-03T14:30:05Z',
};

const operatorStatus: NodeStatusResponse = {
    cpu: { usagePercent: 37.5, cores: 16 },
    ram: { usedGb: 42.25, totalGb: 128, usagePercent: 33.01 },
    storage: null as unknown as NodeStatusResponse['storage'],
    uptimeSeconds: 86400,
    instancesSummary: {
        vms: { running: 6, stopped: 2, paused: 1, total: 9 },
        lxc: { running: 6, stopped: 2, paused: 1, total: 9 },
    },
    stale: false,
    fetchedAt: '2026-10-03T14:30:05Z',
};

const inventory = [
    { id: 101, name: 'Ubuntu Server', type: 'VM', node: 'pve01', status: 'running', ip: '192.168.1.101', cpuUsage: 0.32, ramUsage: 1073741824, maxRam: 4294967296, activeTask: null },
    { id: 201, name: 'Docker Host', type: 'LXC', node: 'pve01', status: 'stopped', ip: null, cpuUsage: null, ramUsage: null, maxRam: 2147483648, activeTask: null },
];

const templates = Array.from({ length: 5 }, (_, index) => ({
    id: `local:iso/plantilla-${index}.iso`,
    name: `plantilla-${index}.iso`,
    type: 'ISO',
    sizeBytes: 1024,
}));

const auditPage = {
    total: 3,
    pagina: 1,
    items: [
        { id: 'a1', nombreUsuario: 'Admin', fechaHora: new Date(Date.now() - 3 * 60_000).toISOString(), accion: 'INICIAR_VM', instanciaNombre: 'PruebaLucas', resultado: 'EXITO', detalles: null },
        { id: 'a2', nombreUsuario: 'Admin', fechaHora: new Date(Date.now() - 60 * 60_000).toISOString(), accion: 'CREAR_USUARIO', instanciaNombre: null, resultado: 'EXITO', detalles: 'usuario@ejemplo.com' },
        { id: 'a3', nombreUsuario: 'Admin', fechaHora: new Date(Date.now() - 61 * 60_000).toISOString(), accion: 'EVENTOS_CONEXION', instanciaNombre: null, resultado: 'EXITO', detalles: null },
    ],
};

function renderDashboard() {
    return render(
        <PendingInstanceCreationsProvider>
            <MemoryRouter initialEntries={['/']}>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/instances" element={<div>pantalla-instancias</div>} />
                    <Route path="/auditoria" element={<div>pantalla-auditoria</div>} />
                </Routes>
            </MemoryRouter>
        </PendingInstanceCreationsProvider>,
    );
}

beforeEach(() => {
    authState.role = 'ADMIN';
    eventChannel.filters.length = 0;
    eventChannel.callbacks.length = 0;
    vi.mocked(getNodeStatus).mockReset();
    vi.mocked(getNodeHistory).mockReset();
    vi.mocked(getNodeHistory).mockResolvedValue([]);
    getMock.mockReset();
    getMock.mockImplementation((path: unknown) => {
        const route = String(path);
        if (route.includes('instances')) return Promise.resolve(inventory);
        if (route.includes('templates')) return Promise.resolve(templates);
        if (route.includes('admin/audit')) return Promise.resolve(auditPage);
        return Promise.reject(new Error(`GET inesperado: ${route}`));
    });
});

// Emite un evento del canal a TODOS los suscriptores registrados para ese tipo
// (el canal real notifica a cada suscriptor, no solo al primero).
async function emitEvent(tipo: string, detalles: Record<string, unknown> | null = null) {
    const targets = eventChannel.callbacks.filter((_, index) => eventChannel.filters[index]?.tipo === tipo);
    if (targets.length === 0) throw new Error(`Ningún componente se suscribió a ${tipo}`);
    await act(async () => {
        for (const callback of targets) {
            callback({ id: `evento-${tipo}`, tipo, severidad: 'INFO', recursoId: '101', detalles });
        }
    });
}

describe('Dashboard node status', () => {
    it('muestra skeleton inicial y luego telemetría, uptime y aviso stale', async () => {
        let resolveRequest!: (value: NodeStatusResponse) => void;
        vi.mocked(getNodeStatus).mockReturnValueOnce(new Promise((resolve) => { resolveRequest = resolve; }));

        renderDashboard();
        expect(screen.getByLabelText('Cargando telemetría')).toBeInTheDocument();

        await act(async () => { resolveRequest({ ...status, stale: true }); });

        expect(await screen.findByText(/Datos desactualizados/)).toBeInTheDocument();
        expect(screen.getByText('37.5%')).toBeInTheDocument();
        expect(screen.getByText('33.01%')).toBeInTheDocument();
        expect(screen.queryByText('1d')).not.toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Resumen de Instancias' })).toBeInTheDocument();
        // Los números consolidados aparecen también en las tarjetas por tipo.
        expect(screen.getAllByText('18').length).toBeGreaterThan(0);
        expect(screen.getAllByText('12').length).toBeGreaterThan(0);
        expect(screen.getAllByText('6').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Advertencia').length).toBeGreaterThan(0);
        expect(screen.getByRole('button', { name: 'Notificaciones' })).toBeInTheDocument();
        expect(screen.getByTestId('cpu-meter-sparkline')).toBeInTheDocument();
        expect(await screen.findByRole('heading', { name: 'Actividad reciente' })).toBeInTheDocument();
        expect(await screen.findByText('Instancia iniciada')).toBeInTheDocument();
        expect(screen.getByText('PruebaLucas')).toBeInTheDocument();
        expect(screen.queryByText('Eventos conexion')).not.toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Alertas y estado' })).toBeInTheDocument();
        expect(screen.getByText('1 instancia detenida')).toBeInTheDocument();
        expect(screen.getByText('5 plantillas disponibles')).toBeInTheDocument();
    });

    it('agrupa el resumen y los recursos como en la referencia sin perder métricas', async () => {
        vi.mocked(getNodeStatus).mockResolvedValue(status);

        renderDashboard();
        const overview = screen.getByTestId('dashboard-overview');
        const summary = within(overview).getByTestId('instances-overview');
        const resources = within(overview).getByTestId('resources-overview');

        expect(await within(summary).findByText('18')).toBeInTheDocument();
        expect(within(summary).getByText('12')).toBeInTheDocument();
        expect(within(summary).getAllByText('6')).toHaveLength(3);
        expect(within(summary).getByText('5 Plantillas')).toBeInTheDocument();
        expect(within(summary).getByTestId('summary-vms')).toBeInTheDocument();
        expect(within(summary).getByTestId('summary-lxc')).toBeInTheDocument();
        for (const label of ['Totales', 'En ejecución (67%)', 'Detenidas o pausadas (33%)']) {
            expect(within(summary).getByText(label).parentElement?.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
        }
        for (const testId of ['summary-vms', 'summary-lxc']) {
            expect(within(summary).getByTestId(testId).querySelector('h3 svg[aria-hidden="true"]')).not.toBeNull();
        }
        expect(within(resources).getByTestId('cpu-meter-sparkline')).toBeInTheDocument();
        expect(within(resources).getByTestId('ram-meter-sparkline')).toBeInTheDocument();
        expect(within(resources).getByRole('progressbar', { name: 'Uso de almacenamiento' })).toHaveAttribute('aria-valuenow', '70');
    });

    it('oculta el medidor de almacenamiento cuando no hay datos', async () => {
        vi.mocked(getNodeStatus).mockResolvedValue({ ...status, storage: null } as unknown as NodeStatusResponse);

        renderDashboard();
        expect(await screen.findByTestId('cpu-meter-sparkline')).toBeInTheDocument();
        expect(screen.queryByRole('progressbar', { name: 'Uso de almacenamiento' })).not.toBeInTheDocument();
        expect(screen.getByTestId('cpu-meter-sparkline').closest('.grid')).not.toHaveClass('sm:grid-cols-[minmax(0,1fr)_minmax(120px,0.8fr)]');
    });

    it('muestra inaccesible y permite reintentar sin recargar', async () => {
        vi.mocked(getNodeStatus)
            .mockRejectedValueOnce(new Error('Sin conexión'))
            .mockResolvedValueOnce({
                ...status,
                storage: { ...status.storage, usedGb: status.storage?.usedGb ?? 0, totalGb: status.storage?.totalGb ?? 0, usagePercent: 69 },
            });

        renderDashboard();
        expect(await screen.findByRole('alert')).toBeInTheDocument();
        expect(screen.getByRole('status', { name: 'Estado del nodo' })).toHaveTextContent('Inaccesible');
        expect(screen.getAllByText('Inaccesible')).toHaveLength(1);

        fireEvent.click(screen.getByRole('button', { name: /Reintentar conexión/ }));

        expect(await screen.findByRole('status', { name: 'Estado del nodo' })).toHaveTextContent('Saludable');
        expect(screen.getAllByText('Saludable')).toHaveLength(1);
        expect(getNodeStatus).toHaveBeenCalledTimes(2);
    });

    it.each([502, 504])('expone el estado inaccesible en el Dashboard ante HTTP %s', async (httpStatus) => {
        vi.mocked(getNodeStatus).mockRejectedValueOnce(
            new ApiRequestError('Error de gateway', httpStatus),
        );

        renderDashboard();

        expect(await screen.findByRole('status', { name: 'Estado del nodo' })).toHaveTextContent('Inaccesible');
        expect(screen.getAllByText('Inaccesible')).toHaveLength(1);
    });

    it('mantiene la carga real sin estados vacíos simulados', () => {
        vi.mocked(getNodeStatus).mockReturnValue(new Promise(() => { }));

        renderDashboard();

        expect(screen.getByLabelText('Cargando telemetría')).toBeInTheDocument();
        expect(screen.queryByText(/^Sin (instancias|novedades|alertas)$/)).not.toBeInTheDocument();
    });

    it('mantiene el Dashboard montado cuando el histórico llega con una forma inesperada', async () => {
        vi.mocked(getNodeStatus).mockResolvedValue(status);
        vi.mocked(getNodeHistory).mockImplementation(() =>
            Promise.resolve({ error: 'sin-historico' } as unknown as NodeHistoryPoint[]),
        );

        renderDashboard();

        expect(await screen.findByText('37.5%')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Resumen de Instancias' })).toBeInTheDocument();
        expect(getNodeHistory).toHaveBeenCalled();
    });

    it('ignora el histórico que no trae RAM ni almacenamiento', async () => {
        vi.mocked(getNodeStatus).mockResolvedValue(status);
        vi.mocked(getNodeHistory).mockResolvedValue([
            { timestamp: 1, cpuPercent: 12 },
            { timestamp: 61, cpuPercent: 18 },
        ]);

        renderDashboard();

        expect(await screen.findByText('37.5%')).toBeInTheDocument();

        for (const testId of ['cpu-meter-sparkline', 'ram-meter-sparkline']) {
            const points =
                screen.getByTestId(testId).querySelector('polyline')?.getAttribute('points') ?? '';

            expect(points).not.toContain('NaN');
        }
    });

    it('conecta Instancias recientes y la insignia de Plantillas, sin bloques simulados', async () => {
        vi.mocked(getNodeStatus).mockResolvedValue(status);

        renderDashboard();
        expect(await screen.findByText('37.5%')).toBeInTheDocument();

        expect(screen.getByRole('heading', { name: 'Instancias recientes' })).toBeInTheDocument();
        expect(await screen.findByText('Ubuntu Server')).toBeInTheDocument();
        expect(screen.getByText('Docker Host')).toBeInTheDocument();
        expect(screen.getAllByText('En ejecución').length).toBeGreaterThan(1);
        expect(screen.getByText('Detenida')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Ver todas' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Ver todas las instancias' })).toBeInTheDocument();

        expect(await screen.findByText('5 Plantillas')).toBeInTheDocument();

        for (const label of ['Sin instancias', 'Sin novedades', 'Sin alertas', 'Acciones rápidas']) {
            expect(screen.queryByText(label)).not.toBeInTheDocument();
        }
        expect(screen.getByRole('button', { name: 'Ver todo' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Ver toda la actividad' })).toBeInTheDocument();
    });

    it('navega a instancias desde el acceso «Ver todas»', async () => {
        vi.mocked(getNodeStatus).mockResolvedValue(status);

        renderDashboard();
        fireEvent.click(await screen.findByRole('button', { name: 'Ver todas' }));

        expect(await screen.findByText('pantalla-instancias')).toBeInTheDocument();
    });

    it('navega a instancias desde «Ver todas las instancias»', async () => {
        vi.mocked(getNodeStatus).mockResolvedValue(status);

        renderDashboard();
        fireEvent.click(await screen.findByRole('button', { name: 'Ver todas las instancias' }));

        expect(await screen.findByText('pantalla-instancias')).toBeInTheDocument();
    });

    it('carga fluidamente para el Operador sin métricas globales ni plantillas', async () => {
        authState.role = 'OPERATOR';
        // El backend devuelve storage null para operadores.
        vi.mocked(getNodeStatus).mockResolvedValue(operatorStatus);
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        try {
            renderDashboard();

            // Verifica que el dashboard adaptó los textos y cargó sin errores
            expect(await screen.findByText('Tus instancias activas')).toBeInTheDocument();
            expect(await screen.findByText('Ubuntu Server')).toBeInTheDocument();
            expect(screen.queryByRole('heading', { name: 'Resumen de Instancias' })).not.toBeInTheDocument();

            // Verifica que las tarjetas de recursos físicos están ocultas
            expect(screen.queryByTestId('resources-overview')).not.toBeInTheDocument();
            expect(screen.queryByRole('progressbar', { name: 'Uso de almacenamiento' })).not.toBeInTheDocument();

            // Verifica que no se ven plantillas ni errores de consola
            expect(screen.queryByText(/\d+ Plantillas/)).not.toBeInTheDocument();
            expect(getMock).not.toHaveBeenCalledWith('node/templates', expect.anything());
            expect(consoleError).not.toHaveBeenCalled();
            expect(consoleWarn).not.toHaveBeenCalled();
        } finally {
            consoleError.mockRestore();
            consoleWarn.mockRestore();
        }
    });

    it('navega a auditoría desde Actividad reciente', async () => {
        vi.mocked(getNodeStatus).mockResolvedValue(status);

        renderDashboard();
        fireEvent.click(await screen.findByRole('button', { name: 'Ver todo' }));

        expect(await screen.findByText('pantalla-auditoria')).toBeInTheDocument();
    });

    it('muestra la actividad cuando los detalles vienen como objeto (contrato RF-08)', async () => {
        vi.mocked(getNodeStatus).mockResolvedValue(status);
        getMock.mockImplementation((path: unknown) => {
            const route = String(path);
            if (route.includes('instances')) return Promise.resolve(inventory);
            if (route.includes('templates')) return Promise.resolve(templates);
            if (route.includes('admin/audit')) {
                return Promise.resolve({
                    total: 1,
                    pagina: 1,
                    items: [{
                        id: 'obj-1',
                        nombreUsuario: 'Admin',
                        fechaHora: new Date(Date.now() - 60_000).toISOString(),
                        accion: 'VERIFICAR_2FA',
                        instanciaNombre: null,
                        resultado: 'FALLA',
                        detalles: { razon: 'código TOTP incorrecto' },
                    }],
                });
            }
            return Promise.reject(new Error(`GET inesperado: ${route}`));
        });

        renderDashboard();

        expect(await screen.findByText('Verificación 2FA')).toBeInTheDocument();
        expect(screen.getByText('código TOTP incorrecto')).toBeInTheDocument();
    });

    it('sigue mostrando los detalles de texto del contrato viejo', async () => {
        vi.mocked(getNodeStatus).mockResolvedValue(status);

        renderDashboard();

        expect(await screen.findByText('usuario@ejemplo.com')).toBeInTheDocument();
    });

    it('la Actividad reciente es solo para Admin', async () => {
        authState.role = 'OPERATOR';
        vi.mocked(getNodeStatus).mockResolvedValue(status);

        renderDashboard();
        expect(await screen.findByText('Tus instancias activas')).toBeInTheDocument();

        expect(screen.queryByRole('heading', { name: 'Actividad reciente' })).not.toBeInTheDocument();
        expect(screen.queryByTestId('resources-overview')).not.toBeInTheDocument();
        expect(getMock).not.toHaveBeenCalledWith(expect.stringContaining('admin/audit'), expect.anything());
        expect(screen.getByRole('heading', { name: 'Alertas y estado' })).toBeInTheDocument();
        expect(screen.queryByText('5 plantillas disponibles')).not.toBeInTheDocument();
    });

    it('muestra Todo en orden cuando no hay alertas', async () => {
        vi.mocked(getNodeStatus).mockResolvedValue(status);
        getMock.mockImplementation((path: unknown) => {
            const route = String(path);
            if (route.includes('instances')) return Promise.resolve([inventory[0]]);
            if (route.includes('templates')) return Promise.resolve([]);
            if (route.includes('admin/audit')) return Promise.resolve(auditPage);
            return Promise.reject(new Error(`GET inesperado: ${route}`));
        });

        renderDashboard();

        expect(await screen.findByText('Todo en orden')).toBeInTheDocument();
        expect(screen.getByText('No hay alertas ni incidencias.')).toBeInTheDocument();
    });

    it('el pie muestra Conexión, Última sincronización y Estado del sistema, sin bloques viejos', async () => {
        // Nodo saludable: el estado va en verde al lado del título.
        vi.mocked(getNodeStatus).mockResolvedValue({
            ...status,
            storage: { ...status.storage, usedGb: status.storage?.usedGb ?? 0, totalGb: status.storage?.totalGb ?? 0, usagePercent: 69 },
        });

        renderDashboard();
        expect(await screen.findByText('37.5%')).toBeInTheDocument();

        expect(screen.getByRole('heading', { name: 'Conexión' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Última sincronización' })).toBeInTheDocument();
        // El pie conserva el título y la telemetría; la salud se muestra en el badge de recursos.
        const encabezadoSistema = screen.getByRole('heading', { name: /Estado del sistema/ });
        expect(encabezadoSistema).toHaveTextContent('Estado del sistema');
        expect(encabezadoSistema).not.toHaveTextContent('Saludable');
        expect(screen.getByRole('status', { name: 'Estado del nodo' })).toHaveClass('text-emerald-700');
        expect(screen.getAllByText('Saludable')).toHaveLength(1);
        expect(screen.getByText('Conectado')).toBeInTheDocument();
        expect(screen.getByText('Tiempo de ejecución: 1d')).toBeInTheDocument();

        expect(screen.queryByRole('heading', { name: 'Canal de eventos' })).not.toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Uptime del nodo' })).not.toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Última telemetría' })).not.toBeInTheDocument();
    });

    it('revalida el estado del nodo ante TASK_FINISHED, sin skeletons', async () => {
        vi.mocked(getNodeStatus)
            .mockResolvedValueOnce(status)
            .mockResolvedValueOnce({
                ...status,
                instancesSummary: {
                    ...status.instancesSummary,
                    vms: { running: 8, stopped: 1, paused: 1, total: 10 },
                },
            });

        renderDashboard();
        expect(await screen.findByText('37.5%')).toBeInTheDocument();
        expect(getNodeStatus).toHaveBeenCalledTimes(1);

        await emitEvent('TASK_FINISHED', { tareaId: 't-1', estado: 'COMPLETED' });

        expect(getNodeStatus).toHaveBeenCalledTimes(2);
        expect(await screen.findByText('19')).toBeInTheDocument();
        expect(screen.queryByLabelText('Cargando telemetría')).not.toBeInTheDocument();
    });

    it('revalida el estado del nodo ante INSTANCE_STATE_CHANGED', async () => {
        vi.mocked(getNodeStatus).mockResolvedValue(status);

        renderDashboard();
        expect(await screen.findByText('37.5%')).toBeInTheDocument();
        expect(getNodeStatus).toHaveBeenCalledTimes(1);

        await emitEvent('INSTANCE_STATE_CHANGED', { vmid: 101, estado: 'running' });

        expect(getNodeStatus).toHaveBeenCalledTimes(2);
    });

    it('recarga la Actividad reciente al recibir un evento del canal', async () => {
        vi.mocked(getNodeStatus).mockResolvedValue(status);
        renderDashboard();
        expect(await screen.findByText('Instancia iniciada')).toBeInTheDocument();

        const auditCalls = () => getMock.mock.calls.filter(([path]) => String(path).includes('admin/audit')).length;
        const before = auditCalls();
        expect(before).toBeGreaterThan(0);

        await emitEvent('TASK_FINISHED', { tareaId: 't-1', estado: 'COMPLETED' });

        expect(auditCalls()).toBe(before + 1);
    });

    it('revalida la Actividad reciente sin skeletons ni perder los datos en pantalla', async () => {
        vi.mocked(getNodeStatus).mockResolvedValue(status);
        let resolveAudit!: (value: unknown) => void;
        let auditCall = 0;
        getMock.mockImplementation((path: unknown) => {
            const route = String(path);
            if (route.includes('instances')) return Promise.resolve(inventory);
            if (route.includes('templates')) return Promise.resolve(templates);
            if (route.includes('admin/audit')) {
                auditCall += 1;
                if (auditCall === 1) return Promise.resolve(auditPage);
                return new Promise((resolve) => { resolveAudit = resolve; });
            }
            return Promise.reject(new Error(`GET inesperado: ${route}`));
        });

        renderDashboard();
        expect(await screen.findByText('Instancia iniciada')).toBeInTheDocument();

        await emitEvent('TASK_FINISHED', { tareaId: 't-1', estado: 'COMPLETED' });

        expect(screen.queryByLabelText('Cargando actividad reciente')).not.toBeInTheDocument();
        expect(screen.getByText('Instancia iniciada')).toBeInTheDocument();

        await act(async () => { resolveAudit(auditPage); });
    });

    it('desglosa el conteo por tipo de recurso (VM y LXC)', async () => {
        vi.mocked(getNodeStatus).mockResolvedValue(status);

        renderDashboard();
        expect(await screen.findByText('37.5%')).toBeInTheDocument();

        const vms = screen.getByTestId('summary-vms');
        expect(vms).toHaveTextContent('Máquinas virtuales (QEMU)');
        expect(vms).toHaveTextContent('9 total');
        expect(within(vms).getByText('6')).toBeInTheDocument();
        expect(within(vms).getByText('2')).toBeInTheDocument();
        expect(within(vms).getByText('En ejecución')).toBeInTheDocument();
        expect(within(vms).getByText('Detenidas')).toBeInTheDocument();

        const lxc = screen.getByTestId('summary-lxc');
        expect(lxc).toHaveTextContent('Contenedores (LXC)');
        expect(lxc).toHaveTextContent('9 total');
    });

    it('muestra skeletons del conteo por tipo mientras carga', () => {
        vi.mocked(getNodeStatus).mockReturnValue(new Promise(() => { }));

        renderDashboard();

        expect(screen.getByLabelText('Cargando conteo de máquinas virtuales')).toBeInTheDocument();
        expect(screen.getByLabelText('Cargando conteo de contenedores')).toBeInTheDocument();
    });
});
