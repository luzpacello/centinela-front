import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  createEventsClient,
  type EventsClientOptions,
  type EventsClientState,
} from '@/services/eventsClient';

// Hook mínimo sobre el cliente de eventos: abre el canal al montar y lo cierra
// al desmontar, y reexpone el estado como un store de React. El reparto de los
// eventos (EventsProvider) y su consumo en el Dashboard son de otra fase.
export function useEvents(options: EventsClientOptions = {}): EventsClientState {
  const [client] = useState(() => createEventsClient(options));

  useEffect(() => {
    client.start();
    return () => client.stop();
  }, [client]);

  return useSyncExternalStore(client.subscribe, client.getSnapshot);
}
