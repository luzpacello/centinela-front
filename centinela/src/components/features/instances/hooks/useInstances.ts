import { useCallback, useEffect, useState } from 'react';
import { fetchInstanceInventory } from '../services/instanceService';
import type { InventoryInstance } from '../types/instance';
import { useEventsContext } from '@/context/EventsContext';
import type { CentinelaEventsMessage } from '@/services/eventsClient';

const INVENTORY_CHANGING_EVENTS = new Set<CentinelaEventsMessage['tipo']>([
  'TASK_FINISHED',
  'INSTANCE_STATE_CHANGED',
]);

export function useInstances() {
  const [instances, setInstances] = useState<InventoryInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const { ultimoMensaje } = useEventsContext();

  // Releer al finalizar una tarea sin ocultar las filas durante la actualización.
  const inventoryChangingEvent = ultimoMensaje !== null && INVENTORY_CHANGING_EVENTS.has(ultimoMensaje.tipo)
    ? ultimoMensaje
    : null;

  const reloadInventory = useCallback(() => {
    setIsLoading(true);
    setErrorMessage(null);
    setReloadCount((previousCount) => previousCount + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchInstanceInventory(controller.signal)
      .then((inventory) => {
        if (!controller.signal.aborted) {
          setInstances(inventory);
          setErrorMessage(null);
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setErrorMessage(error instanceof Error ? error.message : 'No se pudieron cargar las instancias.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [reloadCount, inventoryChangingEvent]);

  return { instances, isLoading, errorMessage, reloadInventory };
}
