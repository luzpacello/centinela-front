import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { useEventsClient } from '@/hooks/useEvents';
import type {
  EventCallback,
  EventsClient,
  EventsClientOptions,
  EventsClientState,
  SubscriptionFilter,
} from '@/services/eventsClient';

// El contexto expone el snapshot del cliente de eventos: estado del canal,
// último mensaje recibido, error y motivo de cierre informado por el backend.
export type EventsContextValue = EventsClientState;

interface EventsProviderProps {
  children: ReactNode;
  // Se entrega tal cual al cliente: permite inyectar un transporte propio.
  options?: EventsClientOptions;
}

// El contexto guarda el cliente compartido, no el snapshot: así los hooks
// derivan de él tanto el estado como las suscripciones selectivas.
const EventsContext = createContext<EventsClient | null>(null);

// Una única conexión de eventos para toda la aplicación. Montarlo sobre el
// árbol protegido abre el canal y desmontarlo lo cierra (logout o expiración
// de sesión), en lugar de abrir un stream por cada consumidor.
export function EventsProvider({ children, options }: EventsProviderProps) {
  const client = useEventsClient(options);

  return <EventsContext.Provider value={client}>{children}</EventsContext.Provider>;
}

// El provider y sus hooks tienen que convivir en el mismo módulo: separarlos
// rompe el enlace entre la conexión y sus consumidores.
// eslint-disable-next-line react-refresh/only-export-components
export function useEventsContext(): EventsContextValue {
  const client = useContext(EventsContext);
  if (!client) {
    throw new Error('useEventsContext debe utilizarse dentro de un EventsProvider');
  }

  const subscribe = useCallback((listener: () => void) => client.subscribe(listener), [client]);
  return useSyncExternalStore(subscribe, client.getSnapshot);
}

// Suscripción selectiva a los eventos del canal compartido. Registra el callback
// en el cliente con un filtro por tipo y/o recurso, y lo da de baja al desmontar
// o cuando cambia el filtro, para no dejar suscriptores colgados.
// eslint-disable-next-line react-refresh/only-export-components
export function useEventSubscription(filter: SubscriptionFilter, callback: EventCallback): void {
  const client = useContext(EventsContext);
  if (!client) {
    throw new Error('useEventSubscription debe utilizarse dentro de un EventsProvider');
  }

  // El callback puede cambiar de identidad en cada render; se guarda en un ref
  // para no resuscribir en cada render y hacerlo solo cuando cambia el filtro.
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const { tipo, recursoId } = filter;
  useEffect(() => {
    const unsubscribe = client.subscribe(
      { tipo, recursoId },
      (event) => callbackRef.current(event),
    );
    return unsubscribe;
  }, [client, tipo, recursoId]);
}
