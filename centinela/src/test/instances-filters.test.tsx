import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

const events = vi.hoisted(() => ({
    state: {
        estado: 'open',
        ultimoMensaje: null,
        error: null,
        motivoCierre: null,
    } as {
        estado: string;
        ultimoMensaje: unknown;
        error: unknown;
        motivoCierre: unknown;
    },
}));

vi.mock('@/context/EventsContext', () => ({
    useEventsContext: () => events.state,
}));

vi.mock('@/context/AuthContext', () => ({
    useAuth: () => ({
        user: null,
        hasRole: () => true,
        isAdmin: () => true,
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

import { apiClient } from '@/services/apiClient';
import Instances from '@/pages/Instances';

const getMock = apiClient.get as unknown as Mock;
const inventory = [
    {
        id: 101,
        name: 'vm-produccion',
        type: 'VM',
        node: 'pve-01',
        status: 'running',
        ip: null,
        cpuUsage: null,
        ramUsage: null,
        maxRam: null,
        nivelAcceso: 'FULL_ACCESS',
        activeTask: null,
    },
    {
        id: 102,
        name: 'base-datos',
        type: 'LXC',
        node: 'pve-01',
        status: 'stopped',
        ip: null,
        cpuUsage: null,
        ramUsage: null,
        maxRam: null,
        nivelAcceso: 'FULL_ACCESS',
        activeTask: null,
    },
    {
        id: 103,
        name: 'vm-pausada',
        type: 'VM',
        node: 'pve-02',
        status: 'paused',
        ip: null,
        cpuUsage: null,
        ramUsage: null,
        maxRam: null,
        nivelAcceso: 'FULL_ACCESS',
        activeTask: null,
    },
];

function renderInstances() {
    return {
        user: userEvent.setup(),
        ...render(
            <MemoryRouter>
                <Instances />
            </MemoryRouter>,
        ),
    };
}

function getSummary() {
    return screen.getByText(/Mostrando/).parentElement;
}

beforeEach(() => {
    events.state.estado = 'open';
    events.state.ultimoMensaje = null;
    events.state.error = null;
    events.state.motivoCierre = null;
    getMock.mockReset();
    getMock.mockResolvedValue(inventory);
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('Filtros del inventario de instancias', () => {
    it('filtra por nombre parcial e ID numérico y no vuelve a consultar el inventario', async () => {
        const { user } = renderInstances();
        await screen.findByText('vm-produccion');

        const searchInput = screen.getByRole('textbox', { name: 'Buscar por ID o nombre' });
        await user.type(searchInput, 'prod');

        expect(screen.getByText('vm-produccion')).toBeInTheDocument();
        expect(screen.queryByText('base-datos')).not.toBeInTheDocument();
        expect(getSummary()).toHaveTextContent('Mostrando 1 de 3 instancias');

        await user.clear(searchInput);
        await user.type(searchInput, '101');
        expect(screen.getByText('vm-produccion')).toBeInTheDocument();
        expect(screen.queryByText('base-datos')).not.toBeInTheDocument();
        expect(getMock).toHaveBeenCalledTimes(1);
    });

    it('incluye instancias pausadas en el filtro de detenidas y en su contador', async () => {
        const { user } = renderInstances();
        await screen.findByText('vm-produccion');

        await user.click(screen.getByRole('tab', { name: /detenidas/i }));

        expect(screen.getByText('base-datos')).toBeInTheDocument();
        expect(screen.getByText('vm-pausada')).toBeInTheDocument();
        expect(screen.queryByText('vm-produccion')).not.toBeInTheDocument();
        expect(getSummary()).toHaveTextContent('Mostrando 2 de 3 instancias');
        expect(screen.getByText('Detenidas').parentElement).toHaveTextContent('2');
        expect(getMock).toHaveBeenCalledTimes(1);
    });

    it('permite restablecer los filtros cuando no hay coincidencias', async () => {
        const { user } = renderInstances();
        await screen.findByText('vm-produccion');

        await user.type(screen.getByRole('textbox', { name: 'Buscar por ID o nombre' }), 'sin-coincidencias');

        expect(screen.getByText('No se encontraron instancias que coincidan con los filtros aplicados')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Restablecer filtros' }));

        expect(screen.getByText('vm-produccion')).toBeInTheDocument();
        expect(screen.getByText('base-datos')).toBeInTheDocument();
        expect(screen.getByText('vm-pausada')).toBeInTheDocument();
        expect(getSummary()).toHaveTextContent('Mostrando 3 de 3 instancias');
        expect(getMock).toHaveBeenCalledTimes(1);
    });

    it('filtra las instancias por tipo VM', async () => {
        const { user } = renderInstances();
        await screen.findByText('vm-produccion');

        await user.click(screen.getByRole('button', { name: 'Filtrar por tipo de instancia' }));
        await user.click(await screen.findByRole('menuitemradio', { name: /VM/ }));

        expect(screen.getByText('vm-produccion')).toBeInTheDocument();
        expect(screen.getByText('vm-pausada')).toBeInTheDocument();
        expect(screen.queryByText('base-datos')).not.toBeInTheDocument();
        expect(getSummary()).toHaveTextContent('Mostrando 2 de 3 instancias');
        expect(getMock).toHaveBeenCalledTimes(1);
    });

    it('filtra las instancias por tipo LXC', async () => {
        const { user } = renderInstances();
        await screen.findByText('vm-produccion');

        await user.click(screen.getByRole('button', { name: 'Filtrar por tipo de instancia' }));
        await user.click(await screen.findByRole('menuitemradio', { name: /LXC/ }));

        expect(screen.getByText('base-datos')).toBeInTheDocument();
        expect(screen.queryByText('vm-produccion')).not.toBeInTheDocument();
        expect(getSummary()).toHaveTextContent('Mostrando 1 de 3 instancias');
        expect(getMock).toHaveBeenCalledTimes(1);
    });
});