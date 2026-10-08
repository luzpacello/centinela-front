import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { MemoryRouter } from 'react-router';

// Mocks idénticos a tu estructura de proyecto
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
const requestMock = apiClient.request as unknown as Mock;

const stoppedInstance = {
  id: 102,
  name: 'base-datos',
  type: 'lxc',
  node: 'pve',
  status: 'stopped',
  ip: null,
  cpuUsage: null,
  ramUsage: null,
  maxRam: null,
  nivelAcceso: 'FULL_ACCESS',
  activeTask: null,
};

// Polyfill para que JSDOM reconozca los métodos del HTMLDialogElement
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
});

function renderInstances() {
  return {
    user: userEvent.setup(),
    ...render(
      <MemoryRouter>
        <Instances />
      </MemoryRouter>
    ),
  };
}

beforeEach(() => {
  events.state.estado = 'open';
  events.state.ultimoMensaje = null;
  events.state.error = null;
  events.state.motivoCierre = null;
  getMock.mockReset();
  requestMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Modales de confirmación antierror para acciones operativas', () => {
  it('Start pide confirmación y cancelar no envía ninguna petición', async () => {
    getMock.mockResolvedValue([stoppedInstance]);

    const { user } = renderInstances();

    // 1. Abrir el menú de acciones de la instancia
    const menuButton = await screen.findByRole('button', { name: /acciones para base-datos/i });
    await user.click(menuButton);

    // 2. Hacer clic en la opción "Encender" (Start)
    const startOption = await screen.findByText(/encender/i);
    await user.click(startOption);

    // 3. Verificar que se despliega el modal de confirmación con su botón correspondiente
    const confirmButton = await screen.findByRole('button', { name: /confirmar|iniciar|encender|aceptar/i });
    expect(confirmButton).toBeInTheDocument();

    // 4. Presionar "Cancelar" en el modal
    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    await user.click(cancelButton);

    // 5. Comprobar que el modal se cierra y que NUNCA se invocó a apiClient.request
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /confirmar|iniciar|encender|aceptar/i })).not.toBeInTheDocument();
    });
    expect(requestMock).not.toHaveBeenCalled();
  });
});