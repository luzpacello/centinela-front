import '@testing-library/jest-dom/vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { ReactNode } from 'react';

// El canal de eventos se simula para poder empujar un TASK_FINISHED sin abrir
// SSE, y el cliente HTTP para devolver un inventario que NO converge solo.
const events = vi.hoisted(() => ({
  state: {
    estado: 'open',
    ultimoMensaje: null as unknown,
    error: null as unknown,
    motivoCierre: null as unknown,
  },
}));

vi.mock('@/context/EventsContext', () => ({
  useEventsContext: () => events.state,
}));

vi.mock('@/services/apiClient', () => ({
  apiClient: { get: vi.fn(), request: vi.fn() },
  ApiRequestError: class ApiRequestError extends Error {},
}));

import { apiClient } from '@/services/apiClient';
import { useInstances } from '@/components/features/instances/hooks/useInstances';
import { PendingInstanceCreationsProvider } from '@/components/features/instances/context/PendingInstanceCreationsContext';

const getMock = apiClient.get as unknown as Mock;

// Dos instancias detenidas: el inventario nunca las muestra en su estado
// objetivo, así que el cierre de la fila sólo puede venir del evento.
const inventory = [
  { id: 110, name: 'api-produccion', type: 'vm', node: 'pve-01', status: 'stopped', activeTask: null },
  { id: 111, name: 'base-datos', type: 'vm', node: 'pve-01', status: 'stopped', activeTask: null },
];

function wrapper({ children }: { children: ReactNode }) {
  return <PendingInstanceCreationsProvider>{children}</PendingInstanceCreationsProvider>;
}

function taskFinished(tareaId: string) {
  return {
    id: `evt-${tareaId}`,
    tipo: 'TASK_FINISHED',
    severidad: 'info',
    recursoId: '110',
    detalles: { tareaId, estado: 'COMPLETED', accion: 'START' },
  };
}

beforeEach(() => {
  events.state.estado = 'open';
  events.state.ultimoMensaje = null;
  getMock.mockResolvedValue(inventory);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('Acciones de energía aceptadas por instancia', () => {
  it('libera la fila con el TASK_FINISHED de su tarea, sin esperar a que el inventario converja', async () => {
    const { result, rerender } = renderHook(() => useInstances(), { wrapper });

    await waitFor(() => expect(result.current.instances).toHaveLength(2));

    act(() => {
      result.current.markPowerActionAccepted(110, 'start', 'task-9');
      result.current.markPowerActionAccepted(111, 'start', 'task-8');
    });

    expect(result.current.pendingPowerActions['110']).toBeDefined();
    expect(result.current.pendingPowerActions['111']).toBeDefined();

    // El inventario sigue devolviendo 'stopped': si el cierre dependiera del
    // estado observado, la acción quedaría pendiente para siempre.
    events.state.ultimoMensaje = taskFinished('task-9');
    rerender();

    await waitFor(() => expect(result.current.pendingPowerActions['110']).toBeUndefined());
    expect(result.current.pendingPowerActions['111']).toBeDefined();
  });
});
