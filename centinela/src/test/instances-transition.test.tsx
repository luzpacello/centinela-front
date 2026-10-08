import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { MemoryRouter } from 'react-router';
// El canal de eventos y la sesión se mockean para poder simular reconexión y
// eventos push sin abrir SSE ni requerir un usuario real.
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
    hasRole: () => false,
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
import { toast } from '@/components/ui/toast';
import Instances from '@/pages/Instances';

const getMock = apiClient.get as unknown as Mock;

const runningInstance = {
  id: 110,
  name: 'api-produccion',
  type: 'vm',
  node: 'pve-01',
  status: 'stopped',
  activeTask: { tareaId: 'task-1', action: 'START', status: 'RUNNING' },
};

const settledInstance = {
  ...runningInstance,
  status: 'running',
  activeTask: null,
};

function taskFinished(id: string, severidad: string, detalles: Record<string, unknown>) {
  return { id, tipo: 'TASK_FINISHED', severidad, recursoId: '110', detalles };
}

function renderInstances() {
  return render(
    <MemoryRouter>
      <Instances />
      </MemoryRouter>
  );
}

function rerenderInstances(rerender: (ui: React.ReactNode) => void) {
  rerender(
    <MemoryRouter>
      <Instances />
    </MemoryRouter>
  );
}

beforeEach(() => {
  events.state.estado = 'open';
  events.state.ultimoMensaje = null;
  events.state.error = null;
  events.state.motivoCierre = null;
  getMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Resincronización del estado en progreso (86e3m0bw2)', () => {
  it('hidrata la fila con spinner y controles bloqueados al cargar con activeTask RUNNING (F5)', async () => {
    getMock.mockResolvedValue([runningInstance]);

    renderInstances();

    const progressButton = await screen.findByRole('button', { name: /encendiendo/i });
    expect(progressButton).toBeDisabled();
    expect(progressButton).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByTestId('instance-transition-spinner')).toBeInTheDocument();
    // La fila bloqueada no expone el menú de acciones.
    expect(screen.queryByRole('button', { name: /acciones para api-produccion/i })).not.toBeInTheDocument();
  });

  it('revalida en silencio al reconectar el stream, sin loader general ni parpadeo', async () => {
    getMock.mockResolvedValueOnce([runningInstance]).mockResolvedValueOnce([settledInstance]);

    const { rerender } = renderInstances();
    await screen.findByRole('button', { name: /encendiendo/i });
    expect(getMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Cargando instancias…')).not.toBeInTheDocument();

    events.state.estado = 'reconnecting';
    rerenderInstances(rerender);
    expect(getMock).toHaveBeenCalledTimes(1);

    events.state.estado = 'open';
    rerenderInstances(rerender);

    await waitFor(() => expect(getMock).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('Cargando instancias…')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('button', { name: /encendiendo/i })).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: /acciones para api-produccion/i })).toBeInTheDocument();
  });

  it('libera la fila y notifica éxito al llegar el TASK_FINISHED correspondiente', async () => {
    const toastSpy = vi.spyOn(toast, 'add').mockReturnValue('toast-id' as never);
    getMock.mockResolvedValue([runningInstance]);

    const { rerender } = renderInstances();
    await screen.findByRole('button', { name: /encendiendo/i });

    events.state.ultimoMensaje = taskFinished('evt-fin-ok', 'INFO', {
      tareaId: 'task-1', accion: 'START', estado: 'COMPLETED', exitstatus: 'OK', motivo: null, error: null,
    });
    rerenderInstances(rerender);

    await waitFor(() => expect(screen.queryByRole('button', { name: /encendiendo/i })).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: /acciones para api-produccion/i })).toBeInTheDocument();
    expect(toastSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
    expect(getMock).toHaveBeenCalledTimes(2);
  });

  it('notifica error cuando el TASK_FINISHED reporta FAILED', async () => {
    const toastSpy = vi.spyOn(toast, 'add').mockReturnValue('toast-id' as never);
    getMock.mockResolvedValue([runningInstance]);

    const { rerender } = renderInstances();
    await screen.findByRole('button', { name: /encendiendo/i });

    events.state.ultimoMensaje = taskFinished('evt-fin-error', 'WARNING', {
      tareaId: 'task-1', accion: 'START', estado: 'FAILED', exitstatus: 'CT 201 not running', motivo: 'PROXMOX_ERROR', error: 'CT 201 not running',
    });
    rerenderInstances(rerender);

    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' })));
    await waitFor(() => expect(screen.queryByRole('button', { name: /encendiendo/i })).not.toBeInTheDocument());
  });

  it('ignora un TASK_FINISHED que no corresponde a la tarea guardada en la fila', async () => {
    const toastSpy = vi.spyOn(toast, 'add').mockReturnValue('toast-id' as never);
    getMock.mockResolvedValue([runningInstance]);

    const { rerender } = renderInstances();
    await screen.findByRole('button', { name: /encendiendo/i });
    toastSpy.mockClear();

    events.state.ultimoMensaje = taskFinished('evt-otro', 'INFO', {
      tareaId: 'task-otra', accion: 'START', estado: 'COMPLETED',
    });
    rerenderInstances(rerender);

    await waitFor(() => expect(getMock).toHaveBeenCalledTimes(2));
    expect(toastSpy).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /encendiendo/i })).toBeInTheDocument();
  });
});
