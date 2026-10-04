import { createContext, useContext, type ReactNode } from 'react';
import { useEvents } from '@/hooks/useEvents';
import type { EventsClientOptions, EventsClientState } from '@/services/eventsClient';

// El contexto reparte tal cual el estado del cliente de eventos: estado del
// canal, último mensaje recibido, error y motivo de cierre informado por el
// backend. No se reinterpreta nada aquí, solo se comparte.
export type EventsContextValue = EventsClientState;

interface EventsProviderProps {
  children: ReactNode;
  // Se entrega tal cual a useEvents: permite inyectar un transporte propio.
  options?: EventsClientOptions;
}

const EventsContext = createContext<EventsContextValue | null>(null);

// Una única conexión de eventos para toda la aplicación. Montarlo sobre el
// árbol protegido abre el canal y desmontarlo lo cierra (logout o expiración
// de sesión), en lugar de abrir un stream por cada consumidor.
export function EventsProvider({ children, options }: EventsProviderProps) {
  // useEvents devuelve el snapshot del cliente, que es referencialmente
  // estable mientras el estado no cambie, así que el valor no se memoiza.
  const value = useEvents(options);

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}

// El provider y su hook tienen que convivir en el mismo módulo: separarlos
// rompe el enlace entre la conexión y sus consumidores.
// eslint-disable-next-line react-refresh/only-export-components
export function useEventsContext(): EventsContextValue {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error('useEventsContext debe utilizarse dentro de un EventsProvider');
  }

  return context;
}