import { ApiRequestError, API_UNAUTHORIZED_EVENT, apiClient, readStoredAccessToken } from '@/services/apiClient';
import { AUTH_SESSION_CHANGED_EVENT } from '@/services/api';
import {
  REALTIME_EVENT_TYPES,
  REALTIME_SEVERITIES,
  type RealtimeEventType,
  type RealtimeSeverity,
} from '@/types/notifications';

// Cliente del canal de eventos en tiempo real (RF-11) por Server-Sent Events.
//
// El navegador no puede mandar el header Authorization en un EventSource, así
// que el acceso se resuelve con un ticket efímero: cada intento de conexión
// pide uno nuevo (POST /events/ticket) y lo pasa en la URL del stream. El JWT
// nunca viaja en la query string. El backend corta el stream con el evento SSE
// "cierre" (terminal) o responde 401 si el ticket/sesión no es válido.

export const EVENTS_TICKET_PATH = '/events/ticket';
export const EVENTS_STREAM_PATH = '/events';

// El backend emite tickets de un solo uso con 30 segundos de vida; por eso no
// se reutiliza un ticket entre intentos: cada conexión pide uno nuevo.
export const EVENTS_TICKET_TTL_MS = 30_000;

// Tipo de evento que transporta el canal. "cierre" es la señal terminal que el
// backend envía como evento SSE con nombre propio antes de cortar el stream.
export type CentinelaEventsMessageType = RealtimeEventType | 'cierre';

export interface CentinelaEventsMessage {
  // Identificador único del evento: el contrato lo usa para deduplicar.
  id: string;
  tipo: CentinelaEventsMessageType;
  severidad: RealtimeSeverity;
  recursoId: string;
  detalles: Record<string, unknown> | null;
}

export type EventsClientStatus =
  | 'idle'
  | 'connecting'
  | 'open'
  | 'reconnecting'
  | 'closed'
  | 'unauthorized'
  | 'failed';

export interface EventsClientState {
  estado: EventsClientStatus;
  ultimoMensaje: CentinelaEventsMessage | null;
  error: Error | null;
  // Motivo reportado por el backend cuando corta el stream con "cierre".
  motivoCierre: string | null;
}

// Contrato mínimo del transporte, para poder inyectar un doble en los tests.
export interface EventsStreamConnection {
  addEventListener(type: string, listener: (event: MessageEvent) => void): void;
  close(): void;
}

export type EventsStreamFactory = (url: string) => EventsStreamConnection;

export interface EventsBackoffOptions {
  baseDelayMs: number;
  maxDelayMs: number;
  maxAttempts: number;
}

export interface EventsClientOptions {
  baseUrl?: string;
  ticketPath?: string;
  streamPath?: string;
  createEventSource?: EventsStreamFactory;
  // Detiene el cliente cuando se cierra la sesión (logout o revocación).
  watchSessionEnd?: boolean;
  backoff?: Partial<EventsBackoffOptions>;
}

export interface EventsClient {
  start(): void;
  stop(): void;
  getStatus(): EventsClientStatus;
  getSnapshot(): EventsClientState;
  subscribe(listener: () => void): () => void;
}

export const DEFAULT_EVENTS_BACKOFF: EventsBackoffOptions = {
  baseDelayMs: 1_000,
  maxDelayMs: 30_000,
  maxAttempts: 5,
};

export function resolveEventsBaseUrl(baseUrl?: string): string {
  const configured = baseUrl ?? import.meta.env?.VITE_API_BASE_URL ?? '/api';
  return configured.replace(/\/+$/, '');
}

export function buildEventsStreamUrl(
  ticket: string,
  baseUrl?: string,
  streamPath: string = EVENTS_STREAM_PATH,
): string {
  return `${resolveEventsBaseUrl(baseUrl)}${streamPath}?ticket=${encodeURIComponent(ticket)}`;
}

// Backoff exponencial acotado: base, base*2, base*4... nunca por encima del tope.
export function computeEventsBackoffDelay(attempt: number, options: EventsBackoffOptions): number {
  const safeAttempt = Math.max(1, Math.floor(attempt));
  return Math.min(options.baseDelayMs * 2 ** (safeAttempt - 1), options.maxDelayMs);
}

export function parseCentinelaEventsMessage(raw: unknown): CentinelaEventsMessage | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;

  const record = parsed as Record<string, unknown>;
  const { id, tipo, severidad, recursoId, detalles } = record;

  if (typeof id !== 'string' || !id.trim()) return null;
  if (typeof tipo !== 'string' || !tipo.trim()) return null;
  if (tipo !== 'cierre' && !REALTIME_EVENT_TYPES.includes(tipo as RealtimeEventType)) return null;
  if (typeof severidad !== 'string' || !REALTIME_SEVERITIES.includes(severidad as RealtimeSeverity)) return null;
  if (typeof recursoId !== 'string' || !recursoId.trim()) return null;
  if (detalles !== undefined && detalles !== null && (typeof detalles !== 'object' || Array.isArray(detalles))) {
    return null;
  }

  return {
    id,
    tipo: tipo as CentinelaEventsMessageType,
    severidad: severidad as RealtimeSeverity,
    recursoId,
    detalles: (detalles as Record<string, unknown> | null | undefined) ?? null,
  };
}

function parseCierreMotivo(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed === 'object' && parsed !== null) {
      const motivo = (parsed as Record<string, unknown>).motivo;
      if (typeof motivo === 'string' && motivo.trim()) return motivo;
    }
  } catch {
    // El motivo es informativo: un cuerpo inesperado no impide cerrar.
  }
  return null;
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

const defaultStreamFactory: EventsStreamFactory = (url) => {
  const source = new EventSource(url);
  return {
    addEventListener: (type, listener) => {
      source.addEventListener(type, (event) => listener(event as MessageEvent));
    },
    close: () => source.close(),
  };
};

export function createEventsClient(options: EventsClientOptions = {}): EventsClient {
  const backoff: EventsBackoffOptions = { ...DEFAULT_EVENTS_BACKOFF, ...options.backoff };
  const ticketPath = options.ticketPath ?? EVENTS_TICKET_PATH;
  const streamPath = options.streamPath ?? EVENTS_STREAM_PATH;
  const watchSessionEnd = options.watchSessionEnd !== false;
  const createEventSource = options.createEventSource ?? defaultStreamFactory;

  let state: EventsClientState = {
    estado: 'idle',
    ultimoMensaje: null,
    error: null,
    motivoCierre: null,
  };
  const listeners = new Set<() => void>();

  // Ids de eventos ya procesados. El broker puede reenviar el mismo evento tras
  // una reconexión transitoria; el Set sobrevive esos reintentos y solo se
  // vacía cuando el cliente se detiene o termina (teardown).
  const seenEventIds = new Set<string>();

  let active = false;
  let attempt = 0;
  let stream: EventsStreamConnection | null = null;
  let reconnectTimer: ReturnType<typeof globalThis.setTimeout> | null = null;

  function notify(): void {
    for (const listener of [...listeners]) listener();
  }

  function patch(partial: Partial<EventsClientState>): void {
    state = { ...state, ...partial };
    notify();
  }

  function setStatus(estado: EventsClientStatus): void {
    if (state.estado === estado) return;
    patch({ estado });
  }

  function clearReconnectTimer(): void {
    if (reconnectTimer !== null) {
      globalThis.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function closeStream(): void {
    if (!stream) return;
    const current = stream;
    stream = null;
    current.close();
  }

  function handleSessionEnded(): void {
    if (!active) return;
    terminate('unauthorized');
  }

  function handleSessionChanged(): void {
    if (!active) return;
    // storeUserSession también emite este evento al iniciar sesión: solo se
    // detiene cuando la sesión dejó de existir (logout).
    if (!readStoredAccessToken()) terminate('unauthorized');
  }

  function attachSessionListeners(): void {
    if (!watchSessionEnd || typeof window === 'undefined') return;
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, handleSessionChanged);
    window.addEventListener(API_UNAUTHORIZED_EVENT, handleSessionEnded);
  }

  function detachSessionListeners(): void {
    if (typeof window === 'undefined') return;
    window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, handleSessionChanged);
    window.removeEventListener(API_UNAUTHORIZED_EVENT, handleSessionEnded);
  }

  function teardown(): void {
    active = false;
    clearReconnectTimer();
    closeStream();
    detachSessionListeners();
    seenEventIds.clear();
  }

  function terminate(estado: EventsClientStatus, error?: Error): void {
    teardown();
    patch(error ? { estado, error } : { estado });
  }

  async function requestTicket(): Promise<string> {
    const response = await apiClient.post<unknown>(ticketPath, undefined, { expectedStatus: 200 });
    const ticket = typeof response === 'object' && response !== null
      ? (response as Record<string, unknown>).ticket
      : undefined;
    if (typeof ticket !== 'string' || !ticket.trim()) {
      throw new ApiRequestError('El servidor no devolvió un ticket de eventos válido.');
    }
    return ticket;
  }

  function scheduleReconnect(): void {
    if (!active || reconnectTimer !== null) return;
    attempt += 1;
    if (attempt > backoff.maxAttempts) {
      terminate('failed', new Error('No se pudo restablecer el canal de eventos.'));
      return;
    }
    setStatus('reconnecting');
    const delay = computeEventsBackoffDelay(attempt, backoff);
    reconnectTimer = globalThis.setTimeout(() => {
      reconnectTimer = null;
      if (!active) return;
      void connect();
    }, delay);
  }

  async function connect(): Promise<void> {
    if (!active) return;
    setStatus('connecting');

    let ticket: string;
    try {
      ticket = await requestTicket();
    } catch (error) {
      if (!active) return;
      const failure = toError(error);
      if (failure instanceof ApiRequestError && failure.status === 401) {
        terminate('unauthorized', failure);
        return;
      }
      patch({ error: failure });
      scheduleReconnect();
      return;
    }

    if (!active) return;
    openStream(ticket);
  }

  function openStream(ticket: string): void {
    const url = buildEventsStreamUrl(ticket, options.baseUrl, streamPath);

    let connection: EventsStreamConnection;
    try {
      connection = createEventSource(url);
    } catch (error) {
      patch({ error: toError(error) });
      scheduleReconnect();
      return;
    }
    stream = connection;

    connection.addEventListener('open', () => {
      if (!active || stream !== connection) return;
      attempt = 0;
      patch({ estado: 'open', error: null });
    });

    connection.addEventListener('message', (event) => {
      if (!active || stream !== connection) return;
      const message = parseCentinelaEventsMessage(event.data);
      if (!message) {
        patch({ error: new Error('Se recibió un evento del canal que no se pudo interpretar.') });
        return;
      }
      // Un evento repetido (mismo id) se ignora por completo: no muta el estado
      // ni notifica a los suscriptores.
      if (seenEventIds.has(message.id)) return;
      seenEventIds.add(message.id);
      patch({ ultimoMensaje: message });
      if (message.tipo === 'cierre') {
        const motivo = message.detalles && typeof message.detalles.motivo === 'string'
          ? message.detalles.motivo
          : null;
        patch({ motivoCierre: motivo });
        terminate('closed');
      }
    });

    // El backend corta el stream con `event: cierre`; no hay reconexión tras él.
    connection.addEventListener('cierre', (event) => {
      if (!active || stream !== connection) return;
      patch({ motivoCierre: parseCierreMotivo(event.data) });
      terminate('closed');
    });

    connection.addEventListener('error', () => {
      if (!active || stream !== connection) return;
      closeStream();
      scheduleReconnect();
    });
  }

  function start(): void {
    if (active) return;
    active = true;
    attempt = 0;
    patch({ estado: 'connecting', error: null, motivoCierre: null });
    attachSessionListeners();
    void connect();
  }

  function stop(): void {
    teardown();
    setStatus('closed');
  }

  return {
    start,
    stop,
    getStatus: () => state.estado,
    getSnapshot: () => state,
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
