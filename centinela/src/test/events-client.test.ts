import '@testing-library/jest-dom/vitest';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { ApiRequestError, API_UNAUTHORIZED_EVENT, apiClient } from '@/services/apiClient';
import { AUTH_SESSION_CHANGED_EVENT } from '@/services/api';
import {
  buildEventsStreamUrl,
  computeEventsBackoffDelay,
  createEventsClient,
  parseCentinelaEventsMessage,
  type CentinelaEventsMessage,
  type EventsClient,
  type EventsClientOptions,
  type EventsStreamConnection,
} from '@/services/eventsClient';
import { useEvents } from '@/hooks/useEvents';

const BACKOFF = { baseDelayMs: 1000, maxDelayMs: 8000, maxAttempts: 5 };
const VALID_MESSAGE: CentinelaEventsMessage = {
  id: 'evt-0001',
  tipo: 'RESOURCE_SATURATION',
  severidad: 'CRITICAL',
  recursoId: 'node-1',
  detalles: { porcentaje: 95 },
};

// Doble de EventSource: expone los listeners registrados para poder simular
// open/error/message/cierre sin abrir una conexión real.
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

  emit(type: string, event: unknown): void {
    for (const listener of [...(this.listeners.get(type) ?? [])]) {
      listener(event as MessageEvent);
    }
  }

  emitType(type: string, data: string): void {
    this.emit(type, { data });
  }

  emitMessage(payload: unknown): void {
    this.emitType('message', typeof payload === 'string' ? payload : JSON.stringify(payload));
  }
}

function createFakeStream(url: string): EventsStreamConnection {
  return new FakeEventsStream(url);
}

function makeClient(options: EventsClientOptions = {}): EventsClient {
  return createEventsClient({
    createEventSource: createFakeStream,
    backoff: BACKOFF,
    ...options,
  });
}

// Deja correr microtasks (resolución de promesas) sin disparar timers reales.
async function settle(): Promise<void> {
  await vi.advanceTimersByTimeAsync(0);
  await Promise.resolve();
  await Promise.resolve();
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

describe('computeEventsBackoffDelay', () => {
  it('crece exponencialmente y se acota en maxDelayMs', () => {
    const options = { baseDelayMs: 1000, maxDelayMs: 8000, maxAttempts: 20 };
    expect([1, 2, 3, 4, 5, 6].map((attempt) => computeEventsBackoffDelay(attempt, options)))
      .toEqual([1000, 2000, 4000, 8000, 8000, 8000]);
  });

  it('trata intentos menores a uno como el primer intento', () => {
    expect(computeEventsBackoffDelay(0, BACKOFF)).toBe(1000);
  });
});

describe('buildEventsStreamUrl', () => {
  it('compone la ruta del stream con el ticket codificado', () => {
    expect(buildEventsStreamUrl('T-1', '/api')).toBe('/api/events?ticket=T-1');
    expect(buildEventsStreamUrl('a b/c', 'https://host/api/')).toBe('https://host/api/events?ticket=a%20b%2Fc');
  });
});

describe('parseCentinelaEventsMessage', () => {
  it('acepta un mensaje con el contrato { id, tipo, severidad, recursoId, detalles }', () => {
    expect(parseCentinelaEventsMessage(JSON.stringify(VALID_MESSAGE))).toEqual(VALID_MESSAGE);
  });

  it('normaliza detalles ausentes a null', () => {
    const parsed = parseCentinelaEventsMessage(JSON.stringify({
      id: 'evt-0002', tipo: 'TASK_FINISHED', severidad: 'INFO', recursoId: '110',
    }));
    expect(parsed).toMatchObject({ id: 'evt-0002', tipo: 'TASK_FINISHED', severidad: 'INFO', recursoId: '110', detalles: null });
  });

  it('rechaza JSON inválido, contratos incompletos y valores fuera del contrato', () => {
    expect(parseCentinelaEventsMessage('{no-es-json')).toBeNull();
    expect(parseCentinelaEventsMessage(JSON.stringify({ id: 'evt-x', severidad: 'INFO', recursoId: 'x' }))).toBeNull();
    expect(parseCentinelaEventsMessage(JSON.stringify({ tipo: 'TASK_FINISHED', severidad: 'INFO', recursoId: 'x' }))).toBeNull();
    expect(parseCentinelaEventsMessage(JSON.stringify({ id: '', tipo: 'TASK_FINISHED', severidad: 'INFO', recursoId: 'x' }))).toBeNull();
    expect(parseCentinelaEventsMessage(JSON.stringify({ id: 42, tipo: 'TASK_FINISHED', severidad: 'INFO', recursoId: 'x' }))).toBeNull();
    expect(parseCentinelaEventsMessage(JSON.stringify({ id: 'evt-x', tipo: 'TASK_FINISHED', severidad: 'LOUD', recursoId: 'x' }))).toBeNull();
    expect(parseCentinelaEventsMessage(JSON.stringify({ id: 'evt-x', tipo: 'TIPO_QUE_NO_EXISTE', severidad: 'INFO', recursoId: 'x' }))).toBeNull();
    expect(parseCentinelaEventsMessage(JSON.stringify({ id: 'evt-x', tipo: 'TASK_FINISHED', severidad: 'INFO', recursoId: '' }))).toBeNull();
    expect(parseCentinelaEventsMessage(JSON.stringify({ id: 'evt-x', tipo: 'TASK_FINISHED', severidad: 'INFO', recursoId: 'x', detalles: [] }))).toBeNull();
  });
});

describe('events client', () => {
  it('pide un ticket efímero y conecta al stream sin exponer el JWT en la URL', async () => {
    window.sessionStorage.setItem('centinela_access', 'jwt-secreto');
    postSpy.mockResolvedValue({ ticket: 'T-1' });

    const client = makeClient();
    client.start();
    await settle();

    expect(postSpy).toHaveBeenCalledWith('/events/ticket', undefined, expect.objectContaining({ expectedStatus: 200 }));
    expect(FakeEventsStream.instances).toHaveLength(1);
    const { url } = FakeEventsStream.instances[0];
    expect(url).toContain('/events?ticket=T-1');
    expect(url).not.toContain('jwt-secreto');
    expect(url).not.toContain('token=');
  });

  it('reutiliza el EventSource global cuando no se inyecta una fábrica', async () => {
    class StubEventSource extends FakeEventsStream {}
    vi.stubGlobal('EventSource', StubEventSource);
    postSpy.mockResolvedValue({ ticket: 'T-9' });

    const client = createEventsClient({ baseUrl: '/api', backoff: BACKOFF });
    client.start();
    await settle();

    expect(FakeEventsStream.instances).toHaveLength(1);
    expect(FakeEventsStream.instances[0].url).toBe('/api/events?ticket=T-9');
  });

  it('pide un ticket nuevo en cada intento de conexión', async () => {
    let attempt = 0;
    postSpy.mockImplementation(async () => ({ ticket: `T-${attempt += 1}` }));

    const client = makeClient();
    client.start();
    await settle();
    expect(FakeEventsStream.instances[0].url).toContain('ticket=T-1');

    FakeEventsStream.instances[0].emit('error', {});
    await vi.advanceTimersByTimeAsync(1000);
    await settle();

    expect(postSpy).toHaveBeenCalledTimes(2);
    expect(FakeEventsStream.instances).toHaveLength(2);
    expect(FakeEventsStream.instances[0].closed).toBe(true);
    expect(FakeEventsStream.instances[1].url).toContain('ticket=T-2');
  });

  it('espacia los reintentos con backoff acotado', async () => {
    postSpy.mockImplementation(async () => ({ ticket: 'T' }));
    const client = makeClient();
    client.start();
    await settle();
    expect(FakeEventsStream.instances).toHaveLength(1);

    for (const delay of [1000, 2000, 4000, 8000, 8000]) {
      const currentIndex = FakeEventsStream.instances.length - 1;
      FakeEventsStream.instances[currentIndex].emit('error', {});

      await vi.advanceTimersByTimeAsync(delay - 1);
      await settle();
      expect(FakeEventsStream.instances).toHaveLength(currentIndex + 1);

      await vi.advanceTimersByTimeAsync(1);
      await settle();
      expect(FakeEventsStream.instances).toHaveLength(currentIndex + 2);
    }

    expect(postSpy).toHaveBeenCalledTimes(6);
  });

  it('trata un 401 al pedir el ticket como terminal', async () => {
    postSpy.mockRejectedValue(new ApiRequestError('sin sesión', 401, 'TOKEN_REVOKED'));

    const client = makeClient();
    client.start();
    await settle();

    expect(FakeEventsStream.instances).toHaveLength(0);
    expect(client.getStatus()).toBe('unauthorized');

    await vi.advanceTimersByTimeAsync(60_000);
    await settle();
    expect(postSpy).toHaveBeenCalledTimes(1);
  });

  it('no reintenta cuando el ticket responde 401 por sesión expirada', async () => {
    postSpy.mockRejectedValue(new ApiRequestError('sesión expirada', 401));

    const client = makeClient();
    client.start();
    await settle();

    expect(client.getStatus()).toBe('unauthorized');
    expect(postSpy).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(60_000);
    await settle();
    expect(postSpy).toHaveBeenCalledTimes(1);
  });

  it('reintenta un fallo no autorizado al pedir el ticket', async () => {
    postSpy
      .mockRejectedValueOnce(new ApiRequestError('servicio caído', 503))
      .mockResolvedValue({ ticket: 'T-1' });

    const client = makeClient();
    client.start();
    await settle();
    expect(postSpy).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(999);
    await settle();
    expect(postSpy).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    await settle();
    expect(postSpy).toHaveBeenCalledTimes(2);
    expect(FakeEventsStream.instances).toHaveLength(1);
  });

  it('deja de reintentar tras agotar los intentos máximos', async () => {
    postSpy.mockRejectedValue(new ApiRequestError('servicio caído', 503));

    const client = makeClient();
    client.start();
    await settle();

    for (let i = 0; i < 5; i += 1) {
      await vi.advanceTimersByTimeAsync(8000);
      await settle();
    }

    expect(client.getStatus()).toBe('failed');
    expect(postSpy).toHaveBeenCalledTimes(6);

    await vi.advanceTimersByTimeAsync(60_000);
    await settle();
    expect(postSpy).toHaveBeenCalledTimes(6);
  });

  it('entrega los eventos tipados al suscriptor', async () => {
    postSpy.mockResolvedValue({ ticket: 'T-1' });
    const client = makeClient();
    client.start();
    await settle();

    const stream = FakeEventsStream.instances[0];
    stream.emit('open', {});
    expect(client.getStatus()).toBe('open');

    stream.emitMessage(VALID_MESSAGE);
    expect(client.getSnapshot().ultimoMensaje).toEqual(VALID_MESSAGE);
  });

  it('ignora mensajes inválidos sin cerrar la conexión', async () => {
    postSpy.mockResolvedValue({ ticket: 'T-1' });
    const client = makeClient();
    client.start();
    await settle();

    const stream = FakeEventsStream.instances[0];
    stream.emitMessage('{no-es-json');
    stream.emitMessage({ tipo: 'TIPO_QUE_NO_EXISTE', severidad: 'INFO', recursoId: 'x' });

    expect(stream.closed).toBe(false);
    expect(client.getSnapshot().ultimoMensaje).toBeNull();
    expect(client.getSnapshot().error).not.toBeNull();

    stream.emitMessage(VALID_MESSAGE);
    expect(client.getSnapshot().ultimoMensaje).toEqual(VALID_MESSAGE);
  });

  it('un evento repetido (mismo id) se procesa una sola vez', async () => {
    postSpy.mockResolvedValue({ ticket: 'T-1' });
    const client = makeClient();
    const listener = vi.fn();
    client.subscribe(listener);
    client.start();
    await settle();

    const stream = FakeEventsStream.instances[0];
    stream.emit('open', {});
    listener.mockClear();

    const evento = { ...VALID_MESSAGE, id: 'evt-repetido' };
    stream.emitMessage(evento);
    expect(client.getSnapshot().ultimoMensaje).toEqual(evento);
    expect(listener).toHaveBeenCalledTimes(1);

    listener.mockClear();
    // El reenvío llega con el mismo id aunque cambie el contenido: se descarta entero.
    stream.emitMessage({ ...evento, severidad: 'WARNING', detalles: { reenviado: true } });
    expect(listener).not.toHaveBeenCalled();
    expect(client.getSnapshot().ultimoMensaje).toEqual(evento);
  });

  it('descarta un reenvío del mismo id después de reconectar', async () => {
    postSpy.mockResolvedValue({ ticket: 'T-1' });
    const client = makeClient();
    client.start();
    await settle();

    const evento = { ...VALID_MESSAGE, id: 'evt-reconexion' };
    FakeEventsStream.instances[0].emit('open', {});
    FakeEventsStream.instances[0].emitMessage(evento);
    expect(client.getSnapshot().ultimoMensaje).toEqual(evento);

    FakeEventsStream.instances[0].emit('error', {});
    await vi.advanceTimersByTimeAsync(1000);
    await settle();
    expect(FakeEventsStream.instances).toHaveLength(2);

    const reconectado = FakeEventsStream.instances[1];
    const listener = vi.fn();
    client.subscribe(listener);
    reconectado.emit('open', {});
    listener.mockClear();

    reconectado.emitMessage(evento);
    expect(listener).not.toHaveBeenCalled();
    expect(client.getSnapshot().ultimoMensaje).toEqual(evento);

    // Un id nuevo sí se sigue procesando tras la reconexión.
    const nuevo = { ...VALID_MESSAGE, id: 'evt-nuevo' };
    reconectado.emitMessage(nuevo);
    expect(client.getSnapshot().ultimoMensaje).toEqual(nuevo);
  });

  it('vuelve a procesar un id ya visto cuando el cliente se reinicia', async () => {
    postSpy.mockResolvedValue({ ticket: 'T-1' });
    const client = makeClient();
    client.start();
    await settle();

    const evento = { ...VALID_MESSAGE, id: 'evt-reinicio' };
    FakeEventsStream.instances[0].emitMessage(evento);
    expect(client.getSnapshot().ultimoMensaje).toEqual(evento);

    client.stop();
    client.start();
    await settle();
    expect(FakeEventsStream.instances).toHaveLength(2);

    const listener = vi.fn();
    client.subscribe(listener);
    FakeEventsStream.instances[1].emitMessage(evento);
    expect(listener).toHaveBeenCalled();
    expect(client.getSnapshot().ultimoMensaje).toEqual(evento);
  });

  it('trata el evento SSE "cierre" como terminal', async () => {
    postSpy.mockResolvedValue({ ticket: 'T-1' });
    const client = makeClient();
    client.start();
    await settle();

    const stream = FakeEventsStream.instances[0];
    stream.emitType('cierre', JSON.stringify({ motivo: 'LOGOUT' }));

    expect(stream.closed).toBe(true);
    expect(client.getStatus()).toBe('closed');
    expect(client.getSnapshot().motivoCierre).toBe('LOGOUT');

    await vi.advanceTimersByTimeAsync(60_000);
    await settle();
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(FakeEventsStream.instances).toHaveLength(1);
  });

  it('trata un mensaje con tipo "cierre" como terminal', async () => {
    postSpy.mockResolvedValue({ ticket: 'T-1' });
    const client = makeClient();
    client.start();
    await settle();

    FakeEventsStream.instances[0].emitMessage({
      id: 'evt-cierre', tipo: 'cierre', severidad: 'INFO', recursoId: 'sesion', detalles: { motivo: 'DESACTIVADO' },
    });

    expect(FakeEventsStream.instances[0].closed).toBe(true);
    expect(client.getStatus()).toBe('closed');
    expect(client.getSnapshot().motivoCierre).toBe('DESACTIVADO');
  });

  it('libera el stream al detener y no reintenta', async () => {
    postSpy.mockResolvedValue({ ticket: 'T-1' });
    const client = makeClient();
    client.start();
    await settle();

    const stream = FakeEventsStream.instances[0];
    client.stop();

    expect(stream.closed).toBe(true);
    expect(client.getStatus()).toBe('closed');

    stream.emit('error', {});
    await vi.advanceTimersByTimeAsync(60_000);
    await settle();
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(FakeEventsStream.instances).toHaveLength(1);
  });

  it('detiene el cliente cuando la sesión termina (logout)', async () => {
    window.sessionStorage.setItem('centinela_access', 'jwt');
    postSpy.mockResolvedValue({ ticket: 'T-1' });
    const client = makeClient();
    client.start();
    await settle();

    const stream = FakeEventsStream.instances[0];
    window.sessionStorage.removeItem('centinela_access');
    window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));

    expect(stream.closed).toBe(true);
    expect(client.getStatus()).toBe('unauthorized');
  });

  it('detiene el cliente ante la revocación de la sesión', async () => {
    postSpy.mockResolvedValue({ ticket: 'T-1' });
    const client = makeClient();
    client.start();
    await settle();

    const stream = FakeEventsStream.instances[0];
    window.dispatchEvent(new Event(API_UNAUTHORIZED_EVENT));

    expect(stream.closed).toBe(true);
    expect(client.getStatus()).toBe('unauthorized');
  });

  it('no se detiene ante un cambio de sesión que conserva el token (login)', async () => {
    window.sessionStorage.setItem('centinela_access', 'jwt');
    postSpy.mockResolvedValue({ ticket: 'T-1' });
    const client = makeClient();
    client.start();
    await settle();

    const stream = FakeEventsStream.instances[0];
    window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));

    expect(stream.closed).toBe(false);
    expect(client.getStatus()).toBe('connecting');
  });

  it('notifica a los suscriptores y permite desuscribirse', async () => {
    postSpy.mockResolvedValue({ ticket: 'T-1' });
    const client = makeClient();
    const listener = vi.fn();
    const unsubscribe = client.subscribe(listener);

    client.start();
    await settle();
    expect(listener).toHaveBeenCalled();

    listener.mockClear();
    unsubscribe();
    client.stop();
    expect(listener).not.toHaveBeenCalled();
  });
});

describe('suscripción selectiva del cliente de eventos', () => {
  it('entrega el evento solo a los suscriptores cuyo filtro coincide', async () => {
    postSpy.mockResolvedValue({ ticket: 'T-1' });
    const client = makeClient();
    const porTipo = vi.fn();
    const porRecurso = vi.fn();
    const comodin = vi.fn();
    client.subscribe({ tipo: 'TASK_FINISHED' }, porTipo);
    client.subscribe({ recursoId: 'node-1' }, porRecurso);
    client.subscribe({}, comodin);

    client.start();
    await settle();
    const stream = FakeEventsStream.instances[0];

    stream.emitMessage({ ...VALID_MESSAGE, id: 'sel-1', tipo: 'TASK_FINISHED', recursoId: 'node-1' });
    expect(porTipo).toHaveBeenCalledTimes(1);
    expect(porRecurso).toHaveBeenCalledTimes(1);
    expect(comodin).toHaveBeenCalledTimes(1);

    // Un evento que no casa con el tipo ni con el recurso solo llega al comodín.
    stream.emitMessage({ ...VALID_MESSAGE, id: 'sel-2', tipo: 'RESOURCE_SATURATION', recursoId: 'node-2' });
    expect(porTipo).toHaveBeenCalledTimes(1);
    expect(porRecurso).toHaveBeenCalledTimes(1);
    expect(comodin).toHaveBeenCalledTimes(2);
  });

  it('compara un recursoId numérico con el string del contrato', async () => {
    postSpy.mockResolvedValue({ ticket: 'T-1' });
    const client = makeClient();
    const porRecurso = vi.fn();
    client.subscribe({ recursoId: 110 }, porRecurso);

    client.start();
    await settle();
    FakeEventsStream.instances[0].emitMessage({ ...VALID_MESSAGE, id: 'num-1', recursoId: '110' });

    expect(porRecurso).toHaveBeenCalledTimes(1);
  });

  it('deduplica por id en el canal raíz antes de despachar a los suscriptores', async () => {
    postSpy.mockResolvedValue({ ticket: 'T-1' });
    const client = makeClient();
    const suscriptor = vi.fn();
    client.subscribe({}, suscriptor);

    client.start();
    await settle();
    const stream = FakeEventsStream.instances[0];

    const evento = { ...VALID_MESSAGE, id: 'dedupe-1' };
    stream.emitMessage(evento);
    stream.emitMessage(evento);
    stream.emitMessage({ ...evento, severidad: 'WARNING' });

    expect(suscriptor).toHaveBeenCalledTimes(1);
    expect(suscriptor).toHaveBeenCalledWith(evento);
  });

  it('exige que todos los campos del filtro coincidan (semántica AND)', async () => {
    postSpy.mockResolvedValue({ ticket: 'T-1' });
    const client = makeClient();
    const filtro = vi.fn();
    client.subscribe({ tipo: 'TASK_FINISHED', recursoId: 'node-1' }, filtro);

    client.start();
    await settle();
    const stream = FakeEventsStream.instances[0];

    stream.emitMessage({ ...VALID_MESSAGE, id: 'and-1', tipo: 'TASK_FINISHED', recursoId: 'node-2' });
    stream.emitMessage({ ...VALID_MESSAGE, id: 'and-2', tipo: 'RESOURCE_SATURATION', recursoId: 'node-1' });
    expect(filtro).not.toHaveBeenCalled();

    stream.emitMessage({ ...VALID_MESSAGE, id: 'and-3', tipo: 'TASK_FINISHED', recursoId: 'node-1' });
    expect(filtro).toHaveBeenCalledTimes(1);
  });

  it('deja de entregar eventos tras desuscribirse', async () => {
    postSpy.mockResolvedValue({ ticket: 'T-1' });
    const client = makeClient();
    const suscriptor = vi.fn();
    const unsubscribe = client.subscribe({}, suscriptor);

    client.start();
    await settle();
    const stream = FakeEventsStream.instances[0];

    stream.emitMessage({ ...VALID_MESSAGE, id: 'unsub-1' });
    expect(suscriptor).toHaveBeenCalledTimes(1);

    unsubscribe();
    stream.emitMessage({ ...VALID_MESSAGE, id: 'unsub-2' });
    expect(suscriptor).toHaveBeenCalledTimes(1);
  });
});

describe('useEvents', () => {
  it('conecta al montar y limpia el cliente al desmontar', async () => {
    postSpy.mockResolvedValue({ ticket: 'T-1' });

    const { unmount } = renderHook(() => useEvents({ createEventSource: createFakeStream, backoff: BACKOFF }));
    await settle();

    expect(FakeEventsStream.instances).toHaveLength(1);
    expect(FakeEventsStream.instances[0].closed).toBe(false);

    unmount();
    expect(FakeEventsStream.instances[0].closed).toBe(true);

    await vi.advanceTimersByTimeAsync(60_000);
    await settle();
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(FakeEventsStream.instances).toHaveLength(1);
  });

  it('expone el último mensaje recibido por el stream', async () => {
    postSpy.mockResolvedValue({ ticket: 'T-1' });

    const { result } = renderHook(() => useEvents({ createEventSource: createFakeStream, backoff: BACKOFF }));
    await settle();

    await act(async () => {
      FakeEventsStream.instances[0].emit('open', {});
      FakeEventsStream.instances[0].emitMessage(VALID_MESSAGE);
    });

    expect(result.current.estado).toBe('open');
    expect(result.current.ultimoMensaje).toEqual(VALID_MESSAGE);
  });
});
