// src/test/instances-errors.test.tsx
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { MemoryRouter } from 'react-router';
import { getErrorMessage } from '@/utils/errorMapper';
import { PendingInstanceCreationsProvider } from '@/components/features/instances/context/PendingInstanceCreationsContext';

vi.mock('@/context/EventsContext', () => ({
  useEventsContext: () => ({ estado: 'open', ultimoMensaje: null, error: null, motivoCierre: null }),
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
    status: number;
    errorCode?: string;
    constructor(message: string, status = 0, errorCode?: string) {
      super(message);
      this.status = status;
      this.errorCode = errorCode;
    }
  },
}));

import { apiClient } from '@/services/apiClient';
import Instances from '@/pages/Instances';

const getMock = apiClient.get as unknown as Mock;
const requestMock = apiClient.request as unknown as Mock;

const runningInstance = {
  id: 115,
  name: 'test-vm-errors',
  type: 'vm',
  node: 'pve',
  status: 'running',
  ip: '192.168.1.50',
  cpuUsage: 10,
  ramUsage: 512,
  maxRam: 2048,
  nivelAcceso: 'FULL_ACCESS',
  activeTask: null,
};

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
});

beforeEach(() => {
  getMock.mockReset();
  requestMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const errorCases = [
  {
    status: 409,
    code: 'INSTANCE_INVALID_STATE',
    expectedMsg: 'El estado actual no corresponde a la acción',
  },
  {
    status: 409,
    code: 'INSTANCE_BUSY',
    expectedMsg: 'La instancia se encuentra ejecutando otra tarea. Aguarde a que finalice.',
  },
  {
    status: 403,
    code: 'INSTANCE_PROTECTED',
    expectedMsg: 'La instancia pertenece a infraestructura protegida y no puede ser modificada.',
  },
  {
    status: 403,
    code: 'INSTANCE_ACCESS_DENIED',
    expectedMsg: 'No posee permisos suficientes para operar sobre esta instancia.',
  },
  {
    status: 502,
    code: 'PROXMOX_UNAVAILABLE',
    expectedMsg: 'El hipervisor Proxmox no está disponible.',
  },
  {
    status: 504,
    code: 'PROXMOX_TIMEOUT',
    expectedMsg: 'La respuesta de Proxmox agotó el tiempo de espera.',
  },
];

describe('Mapeo de errores específicos en modales operativos', () => {
  errorCases.forEach(({ status, code, expectedMsg }) => {
    it(`debe renderizar el mensaje exacto para el código de error: ${code}`, async () => {
      getMock.mockResolvedValue([runningInstance]);

      requestMock.mockRejectedValue({
        status,
        errorCode: code,
        message: 'Error del servidor',
      });

      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <PendingInstanceCreationsProvider>
            <Instances />
          </PendingInstanceCreationsProvider>
        </MemoryRouter>
      );

      const menuButton = await screen.findByRole('button', { name: /acciones para test-vm-errors/i });
      await user.click(menuButton);

      const shutdownOption = await screen.findByText(/apagar/i);
      await user.click(shutdownOption);

      const confirmButton = await screen.findByRole('button', { name: /apagar|confirmar|aceptar/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByRole('alert').textContent).toBe(expectedMsg);
      });

      expect(screen.getByRole('button', { name: 'Aceptar' })).toBeEnabled();
      expect(screen.getByRole('dialog').querySelector('[aria-busy="false"]')).not.toBeNull();

      await user.click(screen.getByRole('button', { name: 'Cancelar' }));
      expect(screen.getByRole('button', { name: /acciones para test-vm-errors/i })).toBeEnabled();
      expect(screen.queryByTestId('instance-transition-spinner')).not.toBeInTheDocument();
    });
  });

  it('distingue el error de estado al intentar encender una instancia ya encendida', async () => {
    expect(getErrorMessage({ status: 409, errorCode: 'INSTANCE_INVALID_STATE' }, 'start'))
      .toBe('La instancia ya está encendida');
  });

  it('requiere la combinación contractual de estado HTTP y código para traducir', () => {
    expect(getErrorMessage({
      status: 502,
      errorCode: 'INSTANCE_BUSY',
      message: 'Error del servidor',
    })).toBe('Error del servidor');
  });
});