// Contrato del canal de eventos en tiempo real (RF-11).
// Es el mismo contrato que el struct RealtimeEvent del backend
// (internal/core/ports/event_port.go): mismos nombres de campo y mismos tipos.
// El servidor WebSocket todavía no existe; esto es solo el contrato de datos compartido.

// Tipos de evento que puede transportar el canal.
export type RealtimeEventType =
  | 'INSTANCE_STATE_CHANGED'
  | 'INSTANCE_CREATED'
  | 'RESOURCE_SATURATION'
  | 'TASK_FINISHED';

// Niveles de severidad de un evento.
export type RealtimeSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

// Tipos de recurso que puede referenciar un evento.
export type RecursoTipo = 'VM' | 'LXC' | 'NODE';

// Estados posibles de una tarea asincrónica reportados por el canal.
export type EstadoTarea = 'RUNNING' | 'COMPLETED' | 'FAILED';

// Esquema genérico de evento del canal en tiempo real.
// Mismos nombres y tipos que el struct de Go: no inventar campos ni valores.
export interface RealtimeEvent {
  id: string;
  tipo: RealtimeEventType;
  severidad: RealtimeSeverity;
  recursoTipo: RecursoTipo;
  recursoId: string;
  mensaje: string;
  fechaHora: string;
  detalles?: Record<string, unknown> | null;
}

// Listas de valores permitidos, para recorrer el contrato sin hardcodear strings.
export const REALTIME_EVENT_TYPES: RealtimeEventType[] = [
  'INSTANCE_STATE_CHANGED',
  'INSTANCE_CREATED',
  'RESOURCE_SATURATION',
  'TASK_FINISHED',
];

export const REALTIME_SEVERITIES: RealtimeSeverity[] = [
  'INFO',
  'WARNING',
  'CRITICAL',
];

export const RECURSO_TIPOS: RecursoTipo[] = ['VM', 'LXC', 'NODE'];

export const ESTADOS_TAREA: EstadoTarea[] = [
  'RUNNING',
  'COMPLETED',
  'FAILED',
];
