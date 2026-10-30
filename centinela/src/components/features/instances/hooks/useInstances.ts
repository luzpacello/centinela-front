import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchInstanceInventory } from '../services/instanceService';
import type { InventoryInstance, InstancePowerAction, InstanceRef, InstanceTransition } from '../types/instance';
import type { InstanceResourceConfiguration } from '../types/instanceDetail';
import { useEventsContext } from '@/context/EventsContext';
import { toast } from '@/components/ui/toast';
import type { CentinelaEventsMessage } from '@/services/eventsClient';
import { usePendingInstanceCreations } from '@/components/features/instances/context/PendingInstanceCreationsContext';

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
  const accion = readDetalleString(message.detalles, 'accion') || 'de la instancia';

  if (estadoTarea === 'FAILED') {
    const error = readDetalleString(message.detalles, 'error');
    const exitstatus = readDetalleString(message.detalles, 'exitstatus');
    const motivo = readDetalleString(message.detalles, 'motivo');

    let descriptionMessage = 'Error al ejecutar la acción sobre la instancia';

    if (motivo === 'PROXMOX_ERROR') {
      const detailsText = error || exitstatus || 'Error desconocido';
      descriptionMessage = `Proxmox no pudo completar la acción ${detailsText}`;
    } else if (motivo === 'TIMEOUT') {
      descriptionMessage = 'La acción no terminó en 3 minutos; revisá el estado de la instancia';
    } else if (error) {
      descriptionMessage = error;
    }

    toast.add({
      title: `La orden falló en ${instance.name}`,
      description: descriptionMessage,
      type: 'error',
    });
    return;
  }

  toast.add({
    title: `Orden completada en ${instance.name}`,
    description: `Operación ${accion} sobre la instancia finalizada correctamente`,
    type: 'success',
  });
}

function getTargetStatus(action: InstancePowerAction): InventoryInstance['status'] {
  switch (action) {
    case 'start':
    case 'reboot':
      return 'running';
    case 'shutdown':
    case 'stop':
      return 'stopped';
  }
}

// Una acción de energía deja de estar pendiente cuando la instancia alcanzó su
// estado objetivo. Devuelve el mismo mapa si nada convergió, para no forzar
// renders ni re-ejecutar el efecto de polling sin necesidad.
function convergePendingPowerActions(
  previous: Record<string, PendingPowerAction>,
  inventory: InventoryInstance[],
): Record<string, PendingPowerAction> {
  let changed = false;
  const next = { ...previous };
  for (const [vmid, pending] of Object.entries(previous)) {
    const instance = inventory.find((item) => String(item.id) === vmid);
    if (!instance) continue;
    const targetStatus = getTargetStatus(pending.action);
    if (instance.status === targetStatus) {
      delete next[vmid];
      changed = true;
    }
  }
  return changed ? next : previous;
}

export function useInstances(suppressSnapshotNotifications = false) {
  const [instances, setInstances] = useState<InventoryInstance[]>([]);
  const { creations, removeCreation } = usePendingInstanceCreations();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);
  const [pendingPowerActions, setPendingPowerActions] = useState<Record<string, PendingPowerAction>>({});
  // Cuenta separada para la revalidación silenciosa: actualiza la tabla sin
  // activar el loader general de pantalla.
  const [silentReloadCount, setSilentReloadCount] = useState(0);
  // Tareas ya finalizadas por evento push. Evita que un inventario con retraso
  // vuelva a bloquear una fila que ya había recibido su TASK_FINISHED.
  const [finishedTaskIds, setFinishedTaskIds] = useState<ReadonlySet<string>>(() => new Set());
  const showRefreshError = useRef(true);
  const hadRunningTask = useRef(false);
  const deletedInstanceIds = useRef(new Set<string>());
  const { ultimoMensaje, estado } = useEventsContext();

  // Espejo de las acciones pendientes para leerlas desde los efectos silencioso
  // y de eventos sin depender del estado (evita closures obsoletos).
  const pendingPowerActionsRef = useRef<Record<string, PendingPowerAction>>({});
  useEffect(() => {
    pendingPowerActionsRef.current = pendingPowerActions;
  }, [pendingPowerActions]);

  const displayInstances = useMemo(() => {
    const byId = new Map(instances.map((instance) => [String(instance.id), instance]));
    for (const creation of creations) {
        const creationId = String(creation.instance.id);
        const serverInstance = byId.get(creationId);
        if (!serverInstance) {
            byId.set(creationId, creation.instance);
            continue;
        }
        byId.set(creationId, creation.status === 'creating'
            ? {
                ...creation.instance,
                ...serverInstance,
                status: 'creating',
                activeTask: creation.instance.activeTask,
            }
            : { ...serverInstance, status: 'stopped', activeTask: null });
    }
    return [...byId.values()];
  }, [instances, creations]);

  useEffect(() => {
    for (const creation of creations) {
        const serverInstance = instances.find((instance) => String(instance.id) === String(creation.instance.id));
        const serverHasCreationTask = serverInstance?.activeTask?.tareaId === creation.tareaId;
        const serverHasFinalState = creation.status === 'stopped' && serverInstance?.status === 'stopped';
        if (serverHasCreationTask || serverHasFinalState) removeCreation(creation.instance.id);
    }
  }, [creations, instances, removeCreation]);

  const clearPendingPowerAction = useCallback((vmid: InstanceRef) => {
    const key = String(vmid);
    setPendingPowerActions((previous) => {
      if (!previous[key]) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  }, []);

  const updateInstanceResources = useCallback((vmid: InstanceRef, configuration: Partial<InstanceResourceConfiguration>) => {
    const ramMb = configuration.ramMb;
    if (ramMb === undefined) return;
    setInstances((current) => current.map((instance) => String(instance.id) === String(vmid)
      ? { ...instance, maxRam: ramMb * 1024 ** 2 }
      : instance));
  }, []);

  // Procesa un inventario recién leído de forma uniforme para las tres rutas de
  // consulta (inicial/manual/poll, silenciosa y de eventos): actualiza la tabla,
  // mantiene los refs de error/polling y converge las acciones de energía.
  // Devuelve el mapa de acciones aún pendientes para decidir si seguir el poll.
  const settleInventory = useCallback((
    inventory: InventoryInstance[],
    currentPending: Record<string, PendingPowerAction>,
  ): Record<string, PendingPowerAction> => {
    for (const id of deletedInstanceIds.current) {
      if (!inventory.some((instance) => String(instance.id) === id)) deletedInstanceIds.current.delete(id);
    }
    const visibleInventory = inventory.filter((instance) => !deletedInstanceIds.current.has(String(instance.id)));
    setInstances(visibleInventory);
    setErrorMessage(null);
    showRefreshError.current = false;
    hadRunningTask.current = visibleInventory.some((instance) => instance.activeTask?.status === 'RUNNING');
    const nextPending = convergePendingPowerActions(currentPending, visibleInventory);
    if (nextPending !== currentPending) setPendingPowerActions(nextPending);
    return nextPending;
  }, []);

  const reloadInventory = useCallback(() => {
    showRefreshError.current = true;
    setIsLoading(true);
    setErrorMessage(null);
    setReloadCount((previousCount) => previousCount + 1);
  }, []);

  const markPowerActionAccepted = useCallback((vmid: InstanceRef, action: InstancePowerAction) => {
    setPendingPowerActions((previous) => ({
      ...previous,
      [String(vmid)]: { action },
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
      queueMicrotask(() => {
        setFinishedTaskIds((previous) => (previous.has(finishedTareaId) ? previous : new Set(previous).add(finishedTareaId)));
      });
      const target = instances.find((instance) => instance.activeTask?.tareaId === finishedTareaId);
      const finishedAction = readDetalleString(ultimoMensaje.detalles, 'accion')
        ?? target?.activeTask?.action
        ?? '';
      if (target && !['CREATE', 'CREATION', 'PROVISION'].includes(finishedAction.toUpperCase())
        && !(suppressSnapshotNotifications && ['ROLLBACK_SNAPSHOT', 'DELETE_SNAPSHOT'].includes(finishedAction.toUpperCase()))) {
        notifyTaskResult(target, ultimoMensaje);
      }
    }

    const action = readDetalleString(ultimoMensaje.detalles, 'accion')
      ?? readDetalleString(ultimoMensaje.detalles, 'action');
    const isCompletedDeletion = ultimoMensaje.tipo === 'TASK_FINISHED'
      && action?.toLowerCase() === 'delete'
      && readDetalleString(ultimoMensaje.detalles, 'estado') === 'COMPLETED';
    const deletedRef = ultimoMensaje.recursoId.trim();
    if (isCompletedDeletion && deletedRef) {
      deletedInstanceIds.current.add(deletedRef);
      queueMicrotask(() => {
        setInstances((current) => current.filter((instance) => String(instance.id) !== deletedRef));
        revalidateInventory();
      });
      return;
    }

    const controller = new AbortController();
    fetchInstanceInventory(controller.signal)
      .then((inventory) => {
        if (controller.signal.aborted) return;
        settleInventory(inventory, pendingPowerActionsRef.current);
      })
      .catch(() => {
        // Silencioso a propósito: se conserva el inventario actual.
      });
    return () => controller.abort();
  }, [ultimoMensaje, instances, revalidateInventory, settleInventory, suppressSnapshotNotifications]);

  // Estado de transición por fila: se deriva del inventario vigente y descarta
  // las tareas ya cerradas por evento. Es la "tarea guardada en la fila".
  const transitioningTasks = useMemo(() => {
    const transitions: Record<string, InstanceTransition> = {};
    for (const instance of displayInstances) {
      const activeTask = instance.activeTask;
      if (activeTask && !finishedTaskIds.has(activeTask.tareaId)) {
        transitions[String(instance.id)] = {
          isTransitioning: true,
          tareaId: activeTask.tareaId,
          action: activeTask.action,
        };
      }
    }
    return transitions;
  }, [displayInstances, finishedTaskIds]);

  return {
    instances: displayInstances,
    isLoading,
    errorMessage,
    reloadInventory,
    revalidateInventory,
    pendingPowerActions,
    markPowerActionAccepted,
    clearPendingPowerAction,
    updateInstanceResources,
    transitioningTasks,
    eventsStatus: estado,
  };
}
