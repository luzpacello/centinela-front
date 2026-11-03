
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

import { ApiRequestError, apiClient } from '@/services/apiClient';
import { useInstanceMetrics } from '@/components/features/instances/metrics/useInstanceMetrics';
import { getWsTicket } from '@/components/features/instances/metrics/metricsService';
import { getMetricsWebSocketUrl, parseMetricsMessage } from '@/components/features/instances/metrics/metricsWebSocket';

vi.mock('@/services/apiClient', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/services/apiClient')>(),
  apiClient: { post: vi.fn() },
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

const mockedPost = vi.mocked(apiClient.post);

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

    mockedPost.mockReset();
    mockedPost.mockResolvedValue({
      ticket: 'ticket-test-123',
    } as never);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('solicita un ticket antes de abrir el WebSocket', async () => {
    renderHook(() => useInstanceMetrics(INSTANCE_REF));

    expect(mockedPost).toHaveBeenCalledWith(
      '/auth/ws-ticket',
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
    mockedPost
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
    expect(mockedPost).toHaveBeenCalledTimes(1);
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

  it('no crea un WebSocket si no hay referencia de instancia', async () => {
    const { result } = renderHook(() => useInstanceMetrics(null));
    await flushPromises();

    expect(result.current.status).toBe('error');
    expect(FakeWebSocket.instances).toHaveLength(0);
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it('acepta referencias numéricas sin perder compatibilidad con mensajes de texto', async () => {
    const { result } = renderHook(() => useInstanceMetrics(101));
    const socket = await connectSocket();
    expect(new URL(socket.url).pathname).toBe('/api/ws/instances/101/metrics');
    act(() => { socket.message({ timestamp: 1700000000, vmid: 101, cpu: 25, mem: 2048 }); });
    act(() => { socket.message({ timestamp: 1700000002, vmid: '101', cpu: 50, mem: 4096 }); });
    expect(result.current.metrics.map((point) => point.cpu)).toEqual([25, 50]);
  });

  it('deriva tasas de red y disco y descarta decrementos de contadores', async () => {
    const { result } = renderHook(() => useInstanceMetrics(INSTANCE_REF));
    const socket = await connectSocket();
    act(() => {
      socket.message({ ...metricMessage(25, 2048, 1700000000), maxmem: 4096, netin: 1000, netout: 2000, diskread: 500, diskwrite: 0 });
      socket.message({ ...metricMessage(50, 3072, 1700000002), maxmem: 4096, netin: 3048, netout: 3024, diskread: 1500, diskwrite: 400 });
      socket.message({ ...metricMessage(30, 1024, 1700000004), netin: 0, netout: 0 });
    });
    expect(result.current.metrics[0].netInBps).toBeNull();
    expect(result.current.metrics[1]).toMatchObject({ netInBps: 1024, netOutBps: 512, diskReadBps: 500, diskWriteBps: 200, ramTotalBytes: 4096 });
    expect(result.current.metrics[2].netInBps).toBeNull();
  });

  it('ignora mensajes de otra máquina y muestras con CPU o fecha inválidas', async () => {
    const { result } = renderHook(() => useInstanceMetrics(INSTANCE_REF));
    const socket = await connectSocket();
    act(() => {
      socket.message(metricMessage(25, 2048, Date.now(), OTHER_INSTANCE_REF));
      socket.message(metricMessage(101, 2048));
      socket.message({ ...metricMessage(25, 2048), timestamp: 'fecha inválida' });
    });
    expect(result.current.metrics).toEqual([]);
    expect(parseMetricsMessage('{')).toBeNull();
  });

  it('rechaza un ticket vacío y no reconecta ante una sesión no autorizada', async () => {
    mockedPost.mockResolvedValueOnce({ ticket: '' } as never);
    await expect(getWsTicket()).rejects.toThrow('ticket WebSocket válido');
    mockedPost.mockRejectedValue(new ApiRequestError('Sesión expirada', 401));
    const { result } = renderHook(() => useInstanceMetrics(INSTANCE_REF));
    await flushPromises();
    expect(result.current.status).toBe('error');
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(FakeWebSocket.instances).toHaveLength(0);
    expect(mockedPost).toHaveBeenCalledTimes(2);
  });

  it('preserva el prefijo de la API y utiliza WSS sobre HTTPS', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/prefix/api/');
    const url = new URL(getMetricsWebSocketUrl(INSTANCE_REF, 'ticket-1'));
    expect(url.protocol).toBe('wss:');
    expect(url.pathname).toBe(`/prefix/api/ws/instances/${INSTANCE_REF}/metrics`);
  });

  it('pausa al permanecer oculto y obtiene un ticket nuevo al volver', async () => {
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    renderHook(() => useInstanceMetrics(INSTANCE_REF));
    const socket = await connectSocket();
    visibility.mockReturnValue('hidden');
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
    expect(socket.closeCalls).toContainEqual({ code: 1000, reason: 'Tab hidden' });
    visibility.mockReturnValue('visible');
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    await flushPromises();
    expect(FakeWebSocket.instances).toHaveLength(2);
    expect(mockedPost).toHaveBeenCalledTimes(2);
  });
});
