import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const events = vi.hoisted(() => ({
    latest: null as null | {
        id: string;
        tipo: string;
        severidad: string;
        recursoId: string;
        detalles: Record<string, unknown>;
    },
}));

vi.mock('@/context/EventsContext', () => ({
    useEventsContext: () => ({
        estado: 'open',
        ultimoMensaje: events.latest,
        error: null,
        motivoCierre: null,
    }),
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
    apiClient: { get: vi.fn().mockResolvedValue([]), request: vi.fn() },
    ApiRequestError: class ApiRequestError extends Error {
        status = 0;
        errorCode?: string;
    },
}));

import { PendingInstanceCreationsProvider, usePendingInstanceCreations } from '@/components/features/instances/context/PendingInstanceCreationsContext';
import { toast } from '@/components/ui/toast';
import Instances from '@/pages/Instances';

function AddPendingCreation() {
    const { addCreation } = usePendingInstanceCreations();
    return (
        <button type="button" onClick={() => addCreation(321, 'create-task-321', 'web-prueba', 'vm')}>
            Agregar creación de prueba
        </button>
    );
}

function renderCreationFlow() {
    return render(
        <PendingInstanceCreationsProvider>
            <MemoryRouter>
                <AddPendingCreation />
                <Instances />
            </MemoryRouter>
        </PendingInstanceCreationsProvider>,
    );
}

beforeEach(() => {
    events.latest = null;
    vi.spyOn(toast, 'add').mockReturnValue('toast-id' as never);
});

describe('seguimiento de creación de instancias', () => {
    it('muestra la fila provisional y la habilita al completar la tarea correlacionada', async () => {
        const { rerender } = renderCreationFlow();
        await screen.findByRole('table', { name: 'Inventario de instancias' });
        fireEvent.click(screen.getByRole('button', { name: 'Agregar creación de prueba' }));

        const creatingAction = await screen.findByRole('button', { name: /creando.*web-prueba/i });
        expect(creatingAction).toBeDisabled();
        expect(screen.getAllByText('Creando…').length).toBeGreaterThan(0);

        events.latest = {
            id: 'evt-create-complete',
            tipo: 'TASK_FINISHED',
            severidad: 'INFO',
            recursoId: '321',
            detalles: { tareaId: 'create-task-321', accion: 'CREATE', estado: 'COMPLETED' },
        };
        rerender(
            <PendingInstanceCreationsProvider>
                <MemoryRouter>
                    <AddPendingCreation />
                    <Instances />
                </MemoryRouter>
            </PendingInstanceCreationsProvider>,
        );

        expect(await screen.findByRole('button', { name: /acciones para web-prueba/i })).toBeInTheDocument();
        expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Instancia aprovisionada',
            description: 'Instancia web-prueba (321) aprovisionada correctamente',
            type: 'success',
        }));
    });

    it('retira la fila temporal y avisa el motivo si la tarea falla', async () => {
        const { rerender } = renderCreationFlow();
        await screen.findByRole('table', { name: 'Inventario de instancias' });
        fireEvent.click(screen.getByRole('button', { name: 'Agregar creación de prueba' }));
        expect(await screen.findByRole('button', { name: /creando.*web-prueba/i })).toBeInTheDocument();

        events.latest = {
            id: 'evt-create-failed',
            tipo: 'TASK_FINISHED',
            severidad: 'WARNING',
            recursoId: '321',
            detalles: {
                tareaId: 'create-task-321',
                accion: 'CREATE',
                estado: 'FAILED',
                motivo: 'PROXMOX_ERROR',
                error: 'No hay memoria suficiente',
            },
        };
        rerender(
            <PendingInstanceCreationsProvider>
                <MemoryRouter>
                    <AddPendingCreation />
                    <Instances />
                </MemoryRouter>
            </PendingInstanceCreationsProvider>,
        );

        await waitFor(() => expect(screen.queryByText('web-prueba')).not.toBeInTheDocument());
        expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
            title: 'No se pudo aprovisionar web-prueba (321)',
            description: 'No hay memoria suficiente',
            type: 'error',
        }));
    });
});
