import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  createEventsClient,
  type EventsClient,
  type EventsClientOptions,
  type EventsClientState,
} from '@/services/eventsClient';

// Crea y mantiene vivo un cliente de eventos: abre el canal al montar y lo
// cierra al desmontar. El EventsProvider lo usa para garantizar una única
// conexión por pestaña, en lugar de que cada consumidor abra la suya.
export function useEventsClient(options: EventsClientOptions = {}): EventsClient {
  const [client] = useState(() => createEventsClient(options));

  useEffect(() => {
    client.start();
    return () => client.stop();
  }, [client]);

  return client;
}

// Hook mínimo sobre el cliente de eventos: reexpone el estado como un store de
// React. Se conserva para usos puntuales; el reparto de los eventos lo hace el
// EventsProvider.
export function useEvents(options: EventsClientOptions = {}): EventsClientState {
  const client = useEventsClient(options);

  return useSyncExternalStore(client.subscribe, client.getSnapshot);
}
