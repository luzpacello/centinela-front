import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchInstanceInventory } from '../services/instanceService';
import type { InventoryInstance, InstancePowerAction } from '../types/instance';
import { useEventsContext } from '@/context/EventsContext';
import type { CentinelaEventsMessage } from '@/services/eventsClient';

const INVENTORY_CHANGING_EVENTS = new Set<CentinelaEventsMessage['tipo']>([
  'TASK_FINISHED',
  'INSTANCE_STATE_CHANGED',
]);
const INVENTORY_POLL_INTERVAL_MS = 2_500;

interface PendingPowerAction {
  action: InstancePowerAction;
}

export function useInstances() {
  const [instances, setInstances] = useState<InventoryInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [pendingPowerActions, setPendingPowerActions] = useState<Record<number, PendingPowerAction>>({});
  const showRefreshError = useRef(true);
  const hadRunningTask = useRef(false);
  const { ultimoMensaje } = useEventsContext();

  // Releer al finalizar una tarea sin ocultar las filas durante la actualización.
  const inventoryChangingEvent = ultimoMensaje !== null && INVENTORY_CHANGING_EVENTS.has(ultimoMensaje.tipo)
    ? ultimoMensaje
    : null;

  const reloadInventory = useCallback(() => {
    showRefreshError.current = true;
    setIsLoading(true);
    setErrorMessage(null);
    setReloadCount((previousCount) => previousCount + 1);
  }, []);

  const markPowerActionAccepted = useCallback((vmid: number, action: InstancePowerAction) => {
    setPendingPowerActions((previous) => ({
      ...previous,
      [vmid]: { action },
    }));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let pollTimer: ReturnType<typeof setTimeout> | undefined;
    fetchInstanceInventory(controller.signal)
      .then((inventory) => {
        if (!controller.signal.aborted) {
          setInstances(inventory);
          setErrorMessage(null);
          showRefreshError.current = false;
          hadRunningTask.current = inventory.some((instance) => instance.activeTask?.status === 'RUNNING');
          const nextPending = { ...pendingPowerActions };
          for (const [vmid, pending] of Object.entries(pendingPowerActions)) {
            const instance = inventory.find((item) => item.id === Number(vmid));
            if (!instance) continue;
            const targetStatus = pending.action === 'start' ? 'running' : 'stopped';
            if (instance.status === targetStatus) {
              delete nextPending[Number(vmid)];
            }
          }
          if (Object.keys(nextPending).length !== Object.keys(pendingPowerActions).length) {
            setPendingPowerActions(nextPending);
          }
          if (Object.keys(nextPending).length > 0 || hadRunningTask.current) {
            pollTimer = setTimeout(() => setReloadCount((count) => count + 1), INVENTORY_POLL_INTERVAL_MS);
          }
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          if (showRefreshError.current) {
            setErrorMessage(error instanceof Error ? error.message : 'No se pudieron cargar las instancias.');
          }
          if (Object.keys(pendingPowerActions).length > 0 || hadRunningTask.current) {
            pollTimer = setTimeout(() => setReloadCount((count) => count + 1), INVENTORY_POLL_INTERVAL_MS);
          }
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => {
      controller.abort();
      clearTimeout(pollTimer);
    };
  }, [reloadCount, inventoryChangingEvent, pendingPowerActions]);

  return { instances, isLoading, errorMessage, reloadInventory, pendingPowerActions, markPowerActionAccepted };
}
