import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

const authState = vi.hoisted(() => ({ isAdmin: true }));

vi.mock('@/context/EventsContext', () => ({
    useEventsContext: () => ({ estado: 'open', ultimoMensaje: null, error: null, motivoCierre: null }),
}));

vi.mock('@/context/AuthContext', () => ({
    useAuth: () => ({
        user: null,
        hasRole: () => true,
        isAdmin: () => authState.isAdmin,
        isOperator: () => false,
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
}));

import { getNodeStatus, type NodeStatusResponse } from '@/components/features/dashboard/services/nodeStatusService';
import { apiClient } from '@/services/apiClient';
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
        <MemoryRouter initialEntries={['/']}>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/instances" element={<div>pantalla-instancias</div>} />
                <Route path="/auditoria" element={<div>pantalla-auditoria</div>} />
            </Routes>
        </MemoryRouter>,
    );
}

beforeEach(() => {
    authState.isAdmin = true;
    vi.mocked(getNodeStatus).mockReset();
    getMock.mockReset();
    getMock.mockImplementation((path: unknown) => {
        const route = String(path);
        if (route.includes('instances')) return Promise.resolve(inventory);
        if (route.includes('templates')) return Promise.resolve(templates);
        if (route.includes('admin/audit')) return Promise.resolve(auditPage);
        return Promise.reject(new Error(`GET inesperado: ${route}`));
    });
});

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
        expect(screen.getByText('1d')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Instancias totales' })).toBeInTheDocument();
        expect(screen.getByText('18')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
        expect(screen.getByText('6')).toBeInTheDocument();
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

    it('muestra inaccesible y permite reintentar sin recargar', async () => {
        vi.mocked(getNodeStatus)
            .mockRejectedValueOnce(new Error('Sin conexión'))
            .mockResolvedValueOnce({ ...status, storage: { ...status.storage, usagePercent: 69 } });

        renderDashboard();
        expect(await screen.findByRole('alert')).toBeInTheDocument();
        expect(screen.getAllByText('Inaccesible').length).toBeGreaterThan(0);

        fireEvent.click(screen.getByRole('button', { name: /Reintentar conexión/ }));

        expect((await screen.findAllByText('Saludable')).length).toBeGreaterThan(0);
        expect(getNodeStatus).toHaveBeenCalledTimes(2);
    });

    it('mantiene la carga real sin estados vacíos simulados', () => {
        vi.mocked(getNodeStatus).mockReturnValue(new Promise(() => {}));

        renderDashboard();

        expect(screen.getByLabelText('Cargando telemetría')).toBeInTheDocument();
        expect(screen.queryByText(/^Sin (instancias|novedades|alertas)$/)).not.toBeInTheDocument();
    });

    it('conecta Instancias recientes y la tarjeta de Plantillas, sin bloques simulados', async () => {
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

        expect(screen.getByRole('heading', { name: 'Plantillas' })).toBeInTheDocument();
        expect(await screen.findByText('5')).toBeInTheDocument();
        expect(screen.getByText('Disponibles para usar')).toBeInTheDocument();

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

    it('la tarjeta de Plantillas es solo para Admin', async () => {
        authState.isAdmin = false;
        vi.mocked(getNodeStatus).mockResolvedValue(status);

        renderDashboard();
        expect(await screen.findByText('37.5%')).toBeInTheDocument();

        expect(screen.queryByRole('heading', { name: 'Plantillas' })).not.toBeInTheDocument();
        expect(getMock).not.toHaveBeenCalledWith('node/templates', expect.anything());
    });

    it('navega a auditoría desde Actividad reciente', async () => {
        vi.mocked(getNodeStatus).mockResolvedValue(status);

        renderDashboard();
        fireEvent.click(await screen.findByRole('button', { name: 'Ver todo' }));

        expect(await screen.findByText('pantalla-auditoria')).toBeInTheDocument();
    });

    it('la Actividad reciente es solo para Admin', async () => {
        authState.isAdmin = false;
        vi.mocked(getNodeStatus).mockResolvedValue(status);

        renderDashboard();
        expect(await screen.findByText('37.5%')).toBeInTheDocument();

        expect(screen.queryByRole('heading', { name: 'Actividad reciente' })).not.toBeInTheDocument();
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
});
