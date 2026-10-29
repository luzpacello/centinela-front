import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock, beforeAll } from 'vitest';
import { SnapshotsTabContent } from '@/components/features/instances/components/detail/SnapshotsTabContent';

const eventsMock = vi.hoisted(() => ({
  state: { ultimoMensaje: null },
}));

const authMock = vi.hoisted(() => ({
  canOperateInstance: () => true,
}));

vi.mock('@/context/EventsContext', () => ({
  useEventsContext: () => eventsMock.state,
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => authMock,
}));

vi.mock('@/services/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    request: vi.fn(),
  },
  ApiRequestError: class ApiRequestError extends Error {
    status?: number;
    constructor(message: string, status?: number) {
      super(message);
      this.status = status;
    }
  },
}));

import { apiClient } from '@/services/apiClient';

const getMock = apiClient.get as unknown as Mock;
const postMock = apiClient.post as unknown as Mock;

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
});

beforeEach(() => {
  getMock.mockReset();
  postMock.mockReset();
  eventsMock.state.ultimoMensaje = null;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('RF-06 / RNF-04 - Pestaña Snapshots y Modal de Creación', () => {
  it('Lista los snapshots omitiendo el marcador sintético current', async () => {
    getMock.mockResolvedValue([
      { name: 'current', snaptime: 1700000000, description: 'Marcador actual' },
      { name: 'Pre_Deploy', snaptime: 1700000100, description: 'Antes de actualizar' },
    ]);

    render(<SnapshotsTabContent vmid={101} />);

    expect(await screen.findByText('Pre_Deploy')).toBeInTheDocument();
    expect(screen.queryByText('Marcador actual')).not.toBeInTheDocument();
  });

  it('Informa error inline y bloquea el envío si el snapname contiene caracteres inválidos', async () => {
    getMock.mockResolvedValue([]);
    const user = userEvent.setup();

    render(<SnapshotsTabContent vmid={101} />);

    const createBtn = await screen.findByRole('button', { name: /crear snapshot/i });
    await user.click(createBtn);

    const dialog = await screen.findByRole('dialog');
    const input = within(dialog).getByRole('textbox', { name: /nombre del snapshot/i });
    const saveBtn = within(dialog).getByRole('button', { name: /guardar snapshot/i });

    // Tipear nombre inválido (comienza con número o tiene espacios)
    await user.type(input, '1_Invalido');
    fireEvent.change(input, { target: { value: '1_Invalido' } });

    expect(within(dialog).getByText(/Debe comenzar con una letra/i)).toBeInTheDocument();
    expect(saveBtn).toBeDisabled();
  });

  it('Despacha POST exitosamente y reacciona ante HTTP 202 Accepted', async () => {
    getMock.mockResolvedValue([]);
    postMock.mockResolvedValue({ tareaId: 't-123', snapname: 'CleanState' });

    const user = userEvent.setup();
    render(<SnapshotsTabContent vmid={101} />);

    await user.click(await screen.findByRole('button', { name: /crear snapshot/i }));

    const dialog = await screen.findByRole('dialog');
    const input = within(dialog).getByRole('textbox', { name: /nombre del snapshot/i });
    const saveBtn = within(dialog).getByRole('button', { name: /guardar snapshot/i });

    await user.type(input, 'CleanState');
    fireEvent.change(input, { target: { value: 'CleanState' } });

    await waitFor(() => expect(saveBtn).toBeEnabled());
    await user.click(saveBtn);

    expect(postMock).toHaveBeenCalledWith('/instances/101/snapshots', {
      snapname: 'CleanState',
      description: undefined,
    });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});