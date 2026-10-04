import { useCallback, useEffect, useState } from 'react';
import { fetchInstanceInventory, type InventoryInstance } from '../services/instanceService';
import { useEventsContext } from '@/context/EventsContext';
import type { CentinelaEventsMessage } from '@/services/eventsClient';

// Eventos que cambian el inventario: el backend terminó una acción de energía
// o una instancia cambió de estado. Los demás no obligan a releerlo.
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

  // Evento que obliga a releer el inventario. Se deriva en el render en lugar de
  // llamar a reloadInventory desde un efecto: el cliente de eventos publica un
  // mensaje nuevo por evento, así que alcanza con agregarlo a las dependencias
  // del fetch. Evita el setState dentro del efecto y mantiene las filas
  // visibles mientras se relee el inventario en segundo plano.
  const eventoDeInventario = ultimoMensaje !== null && INVENTORY_CHANGING_EVENTS.has(ultimoMensaje.tipo)
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
        if (!controller.signal.aborted) setInstances(inventory);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setErrorMessage(error instanceof Error ? error.message : 'No se pudieron cargar las instancias.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [reloadCount, eventoDeInventario]);

  return { instances, isLoading, errorMessage, reloadInventory };
}
