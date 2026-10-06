import { Badge } from '@/components/ui/badge';
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
  const action = pendingAction ?? (activeTask?.status === 'RUNNING' ? activeTask.action.toLowerCase() : null);
  const targetStatus = action === 'start' ? 'running' : action === 'stop' ? 'stopped' : null;
  if (targetStatus && status.toLowerCase() !== targetStatus) {
    return (
      <Badge variant="secondary" className={action === 'start'
        ? instanceStatusPresentation.running.className
        : instanceStatusPresentation.paused.className}>
        <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden="true" />
        {action === 'start' ? 'Encendiendo…' : 'Apagando…'}
      </Badge>
    );
  }
  const presentation = instanceStatusPresentation[status.toLowerCase()];
  return <Badge variant="secondary" className={presentation?.className}>{presentation?.label ?? status}</Badge>;
}
