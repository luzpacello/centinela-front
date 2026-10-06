import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchInstanceInventory } from '../services/instanceService';
import type { InventoryInstance, InstancePowerAction, InstanceTransition } from '../types/instance';
import { useEventsContext } from '@/context/EventsContext';
import { toast } from '@/components/ui/toast';
import type { CentinelaEventsMessage } from '@/services/eventsClient';

// Eventos que obligan a releer el inventario. El TASK_FINISHED además cierra el
// ciclo de la fila que lo esperaba (spinner y bloqueo).
const INVENTORY_CHANGING_EVENTS = new Set<CentinelaEventsMessage['tipo']>([
  'TASK_FINISHED',
  'INSTANCE_STATE_CHANGED',
]);
const INVENTORY_POLL_INTERVAL_MS = 2_500;

interface PendingPowerAction {
  action: InstancePowerAction;
}

function readDetalleString(detalles: Record<string, unknown> | null, key: string): string | null {
  const value = detalles?.[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

// Toast de resultado del TASK_FINISHED: éxito si la tarea terminó COMPLETED,
// error con el motivo reportado por el backend si terminó FAILED.
function notifyTaskResult(instance: InventoryInstance, message: CentinelaEventsMessage): void {
  const estadoTarea = readDetalleString(message.detalles, 'estado');
  if (estadoTarea === 'FAILED') {
    const error = readDetalleString(message.detalles, 'error');
    const motivo = readDetalleString(message.detalles, 'motivo');
    toast.add({
      title: `La orden falló en ${instance.name}`,
      description: error
        ?? (motivo === 'TIMEOUT'
          ? 'La operación superó el tiempo de espera de Proxmox.'
          : 'Proxmox no pudo completar la operación.'),
      type: 'error',
    });
    return;
  }

  toast.add({
    title: `Orden completada en ${instance.name}`,
    description: 'La operación finalizó correctamente.',
    type: 'success',
  });
}

// Una acción de energía deja de estar pendiente cuando la instancia alcanzó su
// estado objetivo. Devuelve el mismo mapa si nada convergió, para no forzar
// renders ni re-ejecutar el efecto de polling sin necesidad.
function convergePendingPowerActions(
  previous: Record<number, PendingPowerAction>,
  inventory: InventoryInstance[],
): Record<number, PendingPowerAction> {
  let changed = false;
  const next = { ...previous };
  for (const [vmid, pending] of Object.entries(previous)) {
    const instance = inventory.find((item) => item.id === Number(vmid));
    if (!instance) continue;
    const targetStatus = pending.action === 'start' ? 'running' : 'stopped';
    if (instance.status === targetStatus) {
      delete next[Number(vmid)];
      changed = true;
    }
  }
  return changed ? next : previous;
}

export function useInstances() {
  const [instances, setInstances] = useState<InventoryInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [pendingPowerActions, setPendingPowerActions] = useState<Record<number, PendingPowerAction>>({});
  // Cuenta separada para la revalidación silenciosa: actualiza la tabla sin
  // activar el loader general de pantalla.
  const [silentReloadCount, setSilentReloadCount] = useState(0);
  // Tareas ya finalizadas por evento push. Evita que un inventario con retraso
  // vuelva a bloquear una fila que ya había recibido su TASK_FINISHED.
  const [finishedTaskIds, setFinishedTaskIds] = useState<ReadonlySet<string>>(() => new Set());
  const showRefreshError = useRef(true);
  const hadRunningTask = useRef(false);
  const { ultimoMensaje, estado } = useEventsContext();

  // Espejo de las acciones pendientes para leerlas desde los efectos silencioso
  // y de eventos sin depender del estado (evita closures obsoletos).
  const pendingPowerActionsRef = useRef<Record<number, PendingPowerAction>>({});
  useEffect(() => {
    pendingPowerActionsRef.current = pendingPowerActions;
  }, [pendingPowerActions]);

  // Procesa un inventario recién leído de forma uniforme para las tres rutas de
  // consulta (inicial/manual/poll, silenciosa y de eventos): actualiza la tabla,
  // mantiene los refs de error/polling y converge las acciones de energía.
  // Devuelve el mapa de acciones aún pendientes para decidir si seguir el poll.
  const settleInventory = useCallback((
    inventory: InventoryInstance[],
    currentPending: Record<number, PendingPowerAction>,
  ): Record<number, PendingPowerAction> => {
    setInstances(inventory);
    setErrorMessage(null);
    showRefreshError.current = false;
    hadRunningTask.current = inventory.some((instance) => instance.activeTask?.status === 'RUNNING');
    const nextPending = convergePendingPowerActions(currentPending, inventory);
    if (nextPending !== currentPending) setPendingPowerActions(nextPending);
    return nextPending;
  }, []);

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

  const revalidateInventory = useCallback(() => {
    setSilentReloadCount((previousCount) => previousCount + 1);
  }, []);

  // Carga inicial, reintento manual y ticks de polling: la única ruta que puede
  // mostrar el loader general de pantalla.
  useEffect(() => {
    const controller = new AbortController();
    let pollTimer: ReturnType<typeof setTimeout> | undefined;
    fetchInstanceInventory(controller.signal)
      .then((inventory) => {
        if (!controller.signal.aborted) {
          const nextPending = settleInventory(inventory, pendingPowerActions);
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
  }, [reloadCount, pendingPowerActions, settleInventory]);

  // Revalidación silenciosa: no toca isLoading, así la tabla no parpadea y las
  // filas ya conocidas permanecen visibles durante la consulta.
  useEffect(() => {
    if (silentReloadCount === 0) return;
    const controller = new AbortController();
    fetchInstanceInventory(controller.signal)
      .then((inventory) => {
        if (!controller.signal.aborted) settleInventory(inventory, pendingPowerActionsRef.current);
      })
      .catch(() => {
        // Silencioso a propósito: si falla, se conserva el inventario actual.
      });
    return () => controller.abort();
  }, [silentReloadCount, settleInventory]);

  // Reconexión exitosa del stream: se revalida en segundo plano lo que haya
  // cambiado durante la caída. Solo dispara tras haber observado una caída,
  // nunca en el montaje inicial.
  const wasDisconnected = useRef(false);
  useEffect(() => {
    if (estado === 'reconnecting') {
      wasDisconnected.current = true;
      return;
    }
    if (estado === 'open' && wasDisconnected.current) {
      wasDisconnected.current = false;
      revalidateInventory();
    }
  }, [estado, revalidateInventory]);

  // Eventos push: el TASK_FINISHED cierra la fila correspondiente y notifica su
  // resultado; todo evento de inventario se revalida en silencio, sin loader.
  const handledMessageId = useRef<string | null>(null);
  useEffect(() => {
    if (!ultimoMensaje || handledMessageId.current === ultimoMensaje.id) return;
    handledMessageId.current = ultimoMensaje.id;
    if (!INVENTORY_CHANGING_EVENTS.has(ultimoMensaje.tipo)) return;

    const finishedTareaId = ultimoMensaje.tipo === 'TASK_FINISHED'
      ? readDetalleString(ultimoMensaje.detalles, 'tareaId')
      : null;
    if (finishedTareaId) {
      const target = instances.find((instance) => instance.activeTask?.tareaId === finishedTareaId);
      if (target) notifyTaskResult(target, ultimoMensaje);
    }

    const controller = new AbortController();
    fetchInstanceInventory(controller.signal)
      .then((inventory) => {
        if (controller.signal.aborted) return;
        settleInventory(inventory, pendingPowerActionsRef.current);
        // Marcar la tarea como cerrada para que un inventario con retraso no
        // vuelva a bloquear una fila que ya recibió su TASK_FINISHED.
        if (finishedTareaId) {
          setFinishedTaskIds((previous) => (previous.has(finishedTareaId) ? previous : new Set(previous).add(finishedTareaId)));
        }
      })
      .catch(() => {
        // Silencioso a propósito: se conserva el inventario actual.
      });
    return () => controller.abort();
  }, [ultimoMensaje, instances, settleInventory]);

  // Estado de transición por fila: se deriva del inventario vigente y descarta
  // las tareas ya cerradas por evento. Es la "tarea guardada en la fila".
  const transitioningTasks = useMemo(() => {
    const transitions: Record<number, InstanceTransition> = {};
    for (const instance of instances) {
      const activeTask = instance.activeTask;
      if (activeTask?.status === 'RUNNING' && !finishedTaskIds.has(activeTask.tareaId)) {
        transitions[instance.id] = {
          isTransitioning: true,
          tareaId: activeTask.tareaId,
          action: activeTask.action,
        };
      }
    }
    return transitions;
  }, [instances, finishedTaskIds]);

  return {
    instances,
    isLoading,
    errorMessage,
    reloadInventory,
    pendingPowerActions,
    markPowerActionAccepted,
    transitioningTasks,
  };
}
