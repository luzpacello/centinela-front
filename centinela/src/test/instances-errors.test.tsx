// src/test/instances-errors.test.tsx
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { MemoryRouter } from 'react-router';

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
    status?: number;
    response?: any;
    constructor(message: string, status?: number, response?: any) {
      super(message);
      this.status = status;
      this.response = response;
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
    code: 'INSTANCE_INVALID_STATE',
    expectedMsg: 'La acción no corresponde al estado actual de la instancia (por ejemplo, la máquina ya se encuentra encendida o apagada).'
  },
  {
    code: 'INSTANCE_BUSY',
    expectedMsg: 'La instancia está ejecutando otra tarea en Proxmox. Por favor, espere a que finalice.' // O ajusta según tu texto exacto
  },
  {
    code: 'INSTANCE_PROTECTED',
    expectedMsg: 'Esta instancia pertenece a la infraestructura crítica y no admite la acción solicitada.'
  },
  {
    code: 'INSTANCE_ACCESS_DENIED',
    expectedMsg: 'No posee permisos operativos suficientes sobre esta instancia.'
  },
  {
    code: 'PROXMOX_UNAVAILABLE',
    expectedMsg: 'El hipervisor Proxmox no se encuentra disponible. Compruebe la conectividad del host.'
  },
  {
    code: 'PROXMOX_TIMEOUT',
    expectedMsg: 'Proxmox no respondió a tiempo. La acción pudo no haberse aplicado en el servidor.'
  },
];

describe('Mapeo de errores específicos en modales operativos', () => {
  errorCases.forEach(({ code, expectedMsg }) => {
    it(`debe renderizar el mensaje exacto para el código de error: ${code}`, async () => {
      getMock.mockResolvedValue([runningInstance]);
      
      // Simulamos la respuesta de error estructurada como la maneja la app
      requestMock.mockRejectedValue({
        errorCode: code,
        response: { data: { errorCode: code } }
      });

      const user = userEvent.setup();
      render(
        <MemoryRouter>
          <Instances />
        </MemoryRouter>
      );

      // 1. Abrir menú de acciones y seleccionar Apagar
      const menuButton = await screen.findByRole('button', { name: /acciones para test-vm-errors/i });
      await user.click(menuButton);

      const shutdownOption = await screen.findByText(/apagar/i);
      await user.click(shutdownOption);

      // 2. Confirmar en el modal (buscando de forma flexible el botón de confirmación)
      const confirmButton = await screen.findByRole('button', { name: /apagar|confirmar|aceptar/i });
      await user.click(confirmButton);

      // 3. Verificar que el mensaje exacto mapeado aparezca en la alerta del modal
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(expectedMsg);
      });
    });
  });
});