import '@testing-library/jest-dom/vitest';
import { act, render, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { apiClient } from '@/services/apiClient';
import {
  type CentinelaEventsMessage,
  type EventsStreamConnection,
  type SubscriptionFilter,
} from '@/services/eventsClient';
import { EventsProvider, useEventSubscription, useEventsContext } from '@/context/EventsContext';

// Pruebas del canal compartido: unicidad de conexión por pestaña y reparto
// selectivo a los suscriptores a través del provider global.

const BACKOFF = { baseDelayMs: 1000, maxDelayMs: 8000, maxAttempts: 5 };
const VALID_MESSAGE: CentinelaEventsMessage = {
  id: 'evt-0001',
  tipo: 'RESOURCE_SATURATION',
  severidad: 'CRITICAL',
  recursoId: 'node-1',
  detalles: { porcentaje: 95 },
};

// Doble de EventSource que registra cada conexión creada en la pestaña.
class FakeEventsStream implements EventsStreamConnection {
  static instances: FakeEventsStream[] = [];

  readonly url: string;
  closed = false;
  private readonly listeners = new Map<string, Array<(event: MessageEvent) => void>>();

  constructor(url: string) {
    this.url = url;
    FakeEventsStream.instances.push(this);
  }

  addEventListener(type: string, listener: (event: MessageEvent) => void): void {
    const current = this.listeners.get(type) ?? [];
    current.push(listener);
    this.listeners.set(type, current);
  }

  close(): void {
    this.closed = true;
  }

  emitMessage(payload: unknown): void {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    for (const listener of [...(this.listeners.get('message') ?? [])]) {
      listener({ data } as MessageEvent);
    }
  }
}

function createFakeStream(url: string): EventsStreamConnection {
  return new FakeEventsStream(url);
}

async function settle(): Promise<void> {
  await vi.advanceTimersByTimeAsync(0);
  await Promise.resolve();
  await Promise.resolve();
}

function providerOptions() {
  return { createEventSource: createFakeStream, backoff: BACKOFF };
}

let postSpy: Mock;

beforeEach(() => {
  vi.useFakeTimers();
  window.sessionStorage.clear();
  FakeEventsStream.instances = [];
  postSpy = vi.spyOn(apiClient, 'post') as unknown as Mock;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

function Consumer({ filter, callback }: { filter: SubscriptionFilter; callback: (event: CentinelaEventsMessage) => void }) {
  useEventSubscription(filter, callback);
  return null;
}

function SnapshotConsumer({ onRender }: { onRender: (estado: string) => void }) {
  const { estado } = useEventsContext();
  onRender(estado);
  return null;
}

describe('EventsProvider y suscripción selectiva', () => {
  it('mantiene una única conexión aunque haya varios suscriptores montados', async () => {
    postSpy.mockResolvedValue({ ticket: 'T-1' });
    const a = vi.fn();
    const b = vi.fn();

    render(
      <EventsProvider options={providerOptions()}>
        <Consumer filter={{ tipo: 'TASK_FINISHED' }} callback={a} />
        <Consumer filter={{ recursoId: 'node-1' }} callback={b} />
      </EventsProvider>,
    );
    await settle();

    expect(FakeEventsStream.instances).toHaveLength(1);
    expect(postSpy).toHaveBeenCalledTimes(1);
  });

  it('reparte cada evento solo al consumidor cuyo filtro lo admite', async () => {
    postSpy.mockResolvedValue({ ticket: 'T-1' });
    const porTipo = vi.fn();
    const porRecurso = vi.fn();

    render(
      <EventsProvider options={providerOptions()}>
        <Consumer filter={{ tipo: 'TASK_FINISHED' }} callback={porTipo} />
        <Consumer filter={{ recursoId: 'node-1' }} callback={porRecurso} />
      </EventsProvider>,
    );
    await settle();
    const stream = FakeEventsStream.instances[0];

    act(() => {
      stream.emitMessage({ ...VALID_MESSAGE, id: 'prov-1', tipo: 'TASK_FINISHED', recursoId: 'node-1' });
    });
    expect(porTipo).toHaveBeenCalledTimes(1);
    expect(porRecurso).toHaveBeenCalledTimes(1);

    act(() => {
      stream.emitMessage({ ...VALID_MESSAGE, id: 'prov-2', tipo: 'RESOURCE_SATURATION', recursoId: 'node-2' });
    });
    expect(porTipo).toHaveBeenCalledTimes(1);
    expect(porRecurso).toHaveBeenCalledTimes(1);
  });

  it('elimina la suscripción del registro al desmontar el consumidor', async () => {
    postSpy.mockResolvedValue({ ticket: 'T-1' });
    const callback = vi.fn();
    const { unmount } = renderHook(
      () => useEventSubscription({ tipo: 'TASK_FINISHED' }, callback),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <EventsProvider options={providerOptions()}>{children}</EventsProvider>
        ),
      },
    );
    await settle();
    const stream = FakeEventsStream.instances[0];

    act(() => {
      stream.emitMessage({ ...VALID_MESSAGE, id: 'unmount-1', tipo: 'TASK_FINISHED' });
    });
    expect(callback).toHaveBeenCalledTimes(1);

    unmount();
    act(() => {
      stream.emitMessage({ ...VALID_MESSAGE, id: 'unmount-2', tipo: 'TASK_FINISHED' });
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('mantiene el snapshot de estado para los consumidores existentes', async () => {
    postSpy.mockResolvedValue({ ticket: 'T-1' });
    const onRender = vi.fn();

    render(
      <EventsProvider options={providerOptions()}>
        <SnapshotConsumer onRender={onRender} />
      </EventsProvider>,
    );
    await settle();
    act(() => {
      FakeEventsStream.instances[0].emitMessage({ ...VALID_MESSAGE, id: 'snap-1' });
    });

    expect(onRender).toHaveBeenLastCalledWith('connecting');
  });
});
