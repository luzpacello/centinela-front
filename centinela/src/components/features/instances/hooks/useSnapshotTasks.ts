import { useCallback, useEffect, useRef, useState } from 'react';
import { useEventSubscription } from '@/context/EventsContext';
import { toast } from '@/components/ui/toast';
import type { CentinelaEventsMessage } from '@/services/eventsClient';
import type { SnapshotAction } from '../components/snapshots/SnapshotActionModal';

interface PendingSnapshotTask { taskId: string; action: SnapshotAction; snapshotName: string }

export function useSnapshotTasks(instanceRef: string | number, activeTaskId?: string | null, eventsStatus?: string) {
  const [pendingTask, setPendingTask] = useState<PendingSnapshotTask | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [lastFinishedTask, setLastFinishedTask] = useState<(PendingSnapshotTask & { status: 'COMPLETED' | 'FAILED' | 'UNKNOWN' }) | null>(null);
  const pendingRef = useRef<PendingSnapshotTask | null>(null);
  const recentEvents = useRef(new Map<string, CentinelaEventsMessage>());
  const observedTaskId = useRef<string | null>(null);
  const observedDisconnection = useRef(false);

  const finishTask = useCallback((event: CentinelaEventsMessage) => {
    const task = pendingRef.current;
    const status = event.detalles?.estado;
    if (!task || event.detalles?.tareaId !== task.taskId || (status !== 'COMPLETED' && status !== 'FAILED')) return;
    pendingRef.current = null;
    setPendingTask(null);
    setLastFinishedTask({ ...task, status });
    setRefreshVersion((version) => version + 1);
    if (status === 'COMPLETED') {
      toast.add({ title: task.action === 'rollback' ? 'Restauración completada' : 'Snapshot eliminado',
        description: task.action === 'rollback' ? `La máquina ha sido restaurada exitosamente al punto ${task.snapshotName}` : `El snapshot ${task.snapshotName} fue eliminado.`, type: 'success' });
    } else {
      toast.add({ title: 'No se pudo completar la operación', description: typeof event.detalles?.error === 'string' ? event.detalles.error : 'La tarea del snapshot falló en Proxmox.', type: 'error' });
    }
  }, []);

  useEventSubscription({ tipo: 'TASK_FINISHED', recursoId: instanceRef }, (event) => {
    const taskId = event.detalles?.tareaId;
    if (typeof taskId !== 'string') return;
    recentEvents.current.set(taskId, event);
    if (recentEvents.current.size > 100) recentEvents.current.delete(recentEvents.current.keys().next().value!);
    finishTask(event);
  });

  useEffect(() => {
    const task = pendingRef.current;
    if (!task) return;
    if (activeTaskId === task.taskId) observedTaskId.current = task.taskId;
    if (eventsStatus === 'reconnecting') { observedDisconnection.current = true; return; }
    if (!observedDisconnection.current || eventsStatus !== 'open' || activeTaskId === task.taskId) return;
    if (observedTaskId.current !== task.taskId) return;
    let active = true;
    // Si se perdió el SSE durante una desconexión, el inventario confirmado
    // puede mostrar que la tarea observada ya no está activa, sin su resultado.
    queueMicrotask(() => {
      if (!active || pendingRef.current?.taskId !== task.taskId) return;
      pendingRef.current = null;
      observedTaskId.current = null;
      observedDisconnection.current = false;
      setPendingTask(null);
      setLastFinishedTask({ ...task, status: 'UNKNOWN' });
      setRefreshVersion((version) => version + 1);
      toast.add({ title: 'Tarea finalizada', description: 'No se recibió el resultado de la operación. Verificá el estado de la instancia y los snapshots.', type: 'warning' });
    });
    return () => { active = false; };
  }, [activeTaskId, pendingTask, eventsStatus]);

  function acceptTask(taskId: string, action: SnapshotAction, snapshotName: string) {
    const task = { taskId, action, snapshotName };
    observedTaskId.current = null;
    observedDisconnection.current = false;
    pendingRef.current = task;
    setPendingTask(task);
    const completedEvent = recentEvents.current.get(taskId);
    if (completedEvent) finishTask(completedEvent);
  }

  return { pendingTask, isSubmitting, setIsSubmitting, acceptTask, refreshVersion, lastFinishedTask };
}
