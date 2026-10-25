
import '@testing-library/jest-dom/vitest';
import { act, renderHook } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { sendJsonPostRequest } from '@/services/api';
import { useInstanceMetrics } from '@/components/features/instances/metrics/useInstanceMetrics';

vi.mock('@/services/api', () => ({
  sendJsonPostRequest: vi.fn(),
}));

const INSTANCE_REF = 'inst_k8Pq2v';
const OTHER_INSTANCE_REF = 'inst_Z9xLm3';

type SocketMessageHandler = ((event: MessageEvent<string>) => void) | null;
type SocketCloseHandler = ((event: CloseEvent) => void) | null;
type SocketEventHandler = (() => void) | null;

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];

  readonly url: string;
  readyState = 0;

  onopen: SocketEventHandler = null;
  onerror: SocketEventHandler = null;
  onmessage: SocketMessageHandler = null;
  onclose: SocketCloseHandler = null;

  closeCalls: Array<{ code?: number; reason?: string }> = [];

  constructor(url: string | URL) {
    this.url = String(url);
    FakeWebSocket.instances.push(this);
  }

  open() {
    this.readyState = 1;
    this.onopen?.();
  }

  message(data: unknown) {
    this.onmessage?.({
      data: JSON.stringify(data),
    } as MessageEvent<string>);
  }

  serverClose(code: number, reason: string) {
    this.readyState = 3;
    this.onclose?.({
      code,
      reason,
      wasClean: true,
    } as CloseEvent);
  }

  close(code?: number, reason?: string) {
    this.closeCalls.push({ code, reason });
    this.readyState = 3;
  }
}

const mockedSendJsonPostRequest = vi.mocked(sendJsonPostRequest);

function metricMessage(
  cpu: number | null,
  mem: number | null,
  timestamp = Date.now(),
  vmid = INSTANCE_REF,
) {
  return {
    timestamp,
    vmid,
    cpu,
    mem,
  };
}

function unavailableMessage() {
  return {
    timestamp: Date.now(),
    vmid: INSTANCE_REF,
    status: 'unavailable',
    error: {
      errorCode: 'PROXMOX_TIMEOUT',
      message: 'Tiempo de espera agotado',
    },
  };
}

async function flushPromises() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function connectSocket(index = 0) {
  await flushPromises();

  const socket = FakeWebSocket.instances[index];

  if (!socket) {
    throw new Error(`No existe el WebSocket número ${index}`);
  }

  act(() => {
    socket.open();
  });

  return socket;
}

describe('FRN-22 - useInstanceMetrics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    FakeWebSocket.instances = [];

    vi.stubGlobal(
      'WebSocket',
      FakeWebSocket as unknown as typeof WebSocket,
    );

    mockedSendJsonPostRequest.mockReset();
    mockedSendJsonPostRequest.mockResolvedValue({
      ticket: 'ticket-test-123',
    } as never);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('solicita un ticket antes de abrir el WebSocket', async () => {
    renderHook(() => useInstanceMetrics(INSTANCE_REF));

    expect(mockedSendJsonPostRequest).toHaveBeenCalledWith(
      'auth/ws-ticket',
      undefined,
      { expectedStatus: 200 },
    );

    await flushPromises();

    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(FakeWebSocket.instances[0].url).toContain(
      '/api/ws/instances/',
    );
  });

  it('incluye la referencia pública y el ticket en la URL, no el JWT', async () => {
    renderHook(() => useInstanceMetrics(INSTANCE_REF));

    await flushPromises();

    const socket = FakeWebSocket.instances[0];
    const url = new URL(socket.url);

    expect(url.pathname).toBe(
      `/api/ws/instances/${INSTANCE_REF}/metrics`,
    );
    expect(url.searchParams.get('ticket')).toBe('ticket-test-123');
    expect(url.searchParams.has('jwt')).toBe(false);
    expect(url.searchParams.has('token')).toBe(false);
  });

    it('cambia el estado de conectando a conectado', async () => {
        const { result } = renderHook(() =>
        useInstanceMetrics(INSTANCE_REF),
        );

        expect(result.current.status).toBe('conectando');

        const socket = await connectSocket();

        expect(result.current.status).toBe('conectado');

        act(() => {
        socket.message(metricMessage(42, 512));
        });

        expect(result.current.metrics).toHaveLength(1);
        expect(result.current.metrics[0]).toMatchObject({
        cpu: 42,
        mem: 512,
        });
    });


    it('mantiene solo los últimos puntos del buffer configurado', async () => {
        const { result } = renderHook(() =>
            useInstanceMetrics(INSTANCE_REF, 3),
        );

        const socket = await connectSocket();

        const baseTimestamp = 1_700_000_000_000;

        act(() => {
            socket.message(metricMessage(10, 100, baseTimestamp));
            socket.message(metricMessage(20, 200, baseTimestamp + 1_000));
            socket.message(metricMessage(30, 300, baseTimestamp + 2_000));
            socket.message(metricMessage(40, 400, baseTimestamp + 3_000));
        });

        expect(result.current.metrics).toHaveLength(3);

        expect(result.current.metrics.map((point) => point.cpu)).toEqual([
            20, 30, 40,
        ]);

        expect(result.current.metrics.map((point) => point.timestamp)).toEqual([
            baseTimestamp + 1_000,
            baseTimestamp + 2_000,
            baseTimestamp + 3_000,
        ]);
    });

  it('acepta CPU entre 0 y 100 sin multiplicarla por 100', async () => {
    const { result } = renderHook(() =>
      useInstanceMetrics(INSTANCE_REF),
    );

    const socket = await connectSocket();

    act(() => {
      socket.message(metricMessage(0, 0));
      socket.message(metricMessage(75.5, 1024));
      socket.message(metricMessage(100, 2048));
    });

    expect(result.current.metrics.map((point) => point.cpu)).toEqual([
      0, 75.5, 100,
    ]);
  });

  it('marca la instancia detenida después de dos muestras nulas consecutivas', async () => {
    const { result } = renderHook(() =>
      useInstanceMetrics(INSTANCE_REF),
    );

    const socket = await connectSocket();

    act(() => {
      socket.message(metricMessage(null, null));
    });

    expect(result.current.isInstanceStopped).toBe(false);

    act(() => {
      socket.message(metricMessage(null, null));
    });

    expect(result.current.isInstanceStopped).toBe(true);

    act(() => {
      socket.message(metricMessage(12, 512));
    });

    expect(result.current.isInstanceStopped).toBe(false);
  });

  it('ignora los errores puntuales de Proxmox sin cerrar el socket', async () => {
    const { result } = renderHook(() =>
      useInstanceMetrics(INSTANCE_REF),
    );

    const socket = await connectSocket();

    act(() => {
      socket.message(metricMessage(25, 256));
      socket.message(unavailableMessage());
    });

    expect(result.current.metrics).toHaveLength(1);
    expect(result.current.metrics[0].cpu).toBe(25);
    expect(socket.closeCalls).toHaveLength(0);
    expect(result.current.status).toBe('conectado');
  });

  it('solicita un ticket nuevo al reconectar después de EVENTS_UNAVAILABLE', async () => {
    mockedSendJsonPostRequest
      .mockResolvedValueOnce({ ticket: 'ticket-1' } as never)
      .mockResolvedValueOnce({ ticket: 'ticket-2' } as never);

    renderHook(() => useInstanceMetrics(INSTANCE_REF));

    await flushPromises();

    const firstSocket = FakeWebSocket.instances[0];

    expect(new URL(firstSocket.url).searchParams.get('ticket')).toBe(
      'ticket-1',
    );

    act(() => {
      firstSocket.serverClose(1008, 'EVENTS_UNAVAILABLE');
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });

    await flushPromises();

    expect(FakeWebSocket.instances).toHaveLength(2);
    expect(new URL(FakeWebSocket.instances[1].url).searchParams.get('ticket'))
      .toBe('ticket-2');
  });

  it('no reintenta si el servidor cierra por INSTANCE_ACCESS_DENIED', async () => {
    const { result } = renderHook(() =>
      useInstanceMetrics(INSTANCE_REF),
    );

    const socket = await connectSocket();

    act(() => {
      socket.serverClose(1008, 'INSTANCE_ACCESS_DENIED');
    });

    expect(result.current.status).toBe('error');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });

    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(mockedSendJsonPostRequest).toHaveBeenCalledTimes(1);
  });

  it('cierra el socket al desmontar el hook', async () => {
    const { unmount } = renderHook(() =>
      useInstanceMetrics(INSTANCE_REF),
    );

    const socket = await connectSocket();

    unmount();

    expect(socket.closeCalls).toContainEqual({
      code: 1000,
      reason: 'Component unmounted',
    });
  });

  it('cierra la conexión anterior cuando cambia la referencia de instancia', async () => {
    const { rerender } = renderHook(
      ({ instanceRef }: { instanceRef: string }) =>
        useInstanceMetrics(instanceRef),
      {
        initialProps: { instanceRef: INSTANCE_REF },
      },
    );

    const firstSocket = await connectSocket();

    rerender({ instanceRef: OTHER_INSTANCE_REF });

    expect(firstSocket.closeCalls).toContainEqual({
      code: 1000,
      reason: 'Component unmounted',
    });

    await flushPromises();

    expect(FakeWebSocket.instances).toHaveLength(2);

    const secondUrl = new URL(FakeWebSocket.instances[1].url);

    expect(secondUrl.pathname).toBe(
      `/api/ws/instances/${OTHER_INSTANCE_REF}/metrics`,
    );
  });

  it('no crea un WebSocket si no hay referencia de instancia', () => {
    const { result } = renderHook(() => useInstanceMetrics(null));

    expect(result.current.status).toBe('error');
    expect(FakeWebSocket.instances).toHaveLength(0);
    expect(mockedSendJsonPostRequest).not.toHaveBeenCalled();
  });
});
