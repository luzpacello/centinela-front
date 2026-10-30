import { Badge } from '@/components/ui/badge';
import { describeActionProgress } from '../utils/actionLabels';
import { Loader2 } from 'lucide-react';
import type { InstanceActiveTask, InstancePowerAction, InstanceType } from '../types/instance';

export function InstanceTypeBadge({ type }: { type: InstanceType }) {
  return (
    <Badge variant="secondary" className={type === 'VM'
      ? 'border-0 bg-blue-50 text-blue-700'
      : 'border-0 bg-emerald-50 text-emerald-700'}>
      {type}
    </Badge>
  );
}

const instanceStatusPresentation: Record<string, { label: string; className: string }> = {
  running: { label: 'Running', className: 'border-0 bg-emerald-50 text-emerald-700' },
  stopped: { label: 'Stopped', className: 'border-0 bg-slate-100 text-slate-600' },
  paused: { label: 'Paused', className: 'border-0 bg-amber-50 text-amber-700' },
};

export function InstanceStatusBadge({ status, activeTask, pendingAction }: {
  status: string;
  activeTask?: InstanceActiveTask | null;
  pendingAction?: InstancePowerAction;
}) {
  const normalizedStatus = status.trim().toUpperCase().replaceAll('-', '_').replaceAll(' ', '_');
  const normalizedTaskAction = activeTask?.action.trim().toUpperCase().replaceAll('-', '_').replaceAll(' ', '_') ?? '';
  if (activeTask?.status === 'RUNNING' && normalizedTaskAction.includes('DELETE_SNAPSHOT')) {
    return <Badge variant="secondary" className="border-0 bg-amber-50 text-amber-700"><Loader2 data-icon="inline-start" className="animate-spin" aria-hidden="true" />Eliminando snapshot…</Badge>;
  }
  if (normalizedStatus === 'SNAPSHOTTING' || (activeTask?.status === 'RUNNING' && normalizedTaskAction.includes('SNAPSHOT') && !normalizedTaskAction.includes('ROLLBACK'))) {
    return (
      <Badge variant="secondary" className="border-0 bg-blue-50 text-blue-700">
        <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden="true" />
        Creando Snapshot...
      </Badge>
    );
  }
  if (normalizedStatus === 'ROLLING_BACK' || normalizedTaskAction.includes('ROLLBACK')) {
    return (
      <Badge variant="secondary" className="border-0 bg-amber-50 text-amber-700">
        <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden="true" />
        Restaurando...
      </Badge>
    );
  }
  if (activeTask?.status === 'RUNNING' && ['CREATE', 'CREATION', 'PROVISION'].includes(activeTask.action.toUpperCase())) {
    return (
      <Badge variant="secondary" className="border-0 bg-blue-50 text-blue-700">
        <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden="true" />
        Creando…
      </Badge>
    );
  }
  // Transición en curso: se cubre toda la familia de energía, no sólo
  // start/stop. Antes un apagado ordenado (shutdown) o un reinicio no mostraban
  // su estado y la fila seguía pareciendo "Running" hasta el final.
  const action = pendingAction ?? (activeTask?.status === 'RUNNING' ? activeTask.action.toLowerCase() : null);
  // Un reinicio no cambia el estado final: mientras está pendiente se muestra
  // igual, porque el invitado puede volver a "running" sin pasar por stopped.
  const finishedStatus = action === 'start'
    ? 'running'
    : action === 'stop' || action === 'shutdown'
      ? 'stopped'
      : null;
  const isTransitioning = action === 'reboot'
    || Boolean(finishedStatus && status.toLowerCase() !== finishedStatus);
  if (action && isTransitioning) {
    return (
      <Badge variant="secondary" className={action === 'start' || action === 'reboot'
        ? instanceStatusPresentation.running.className
        : instanceStatusPresentation.paused.className}>
        <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden="true" />
        {describeActionProgress(action)}
      </Badge>
    );
  }
  const presentation = instanceStatusPresentation[status.toLowerCase()];
  return <Badge variant="secondary" className={presentation?.className}>{presentation?.label ?? status}</Badge>;
}
