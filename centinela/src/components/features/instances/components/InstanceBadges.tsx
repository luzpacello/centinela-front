import { Badge } from '@/components/ui/badge';
import type { InstanceType } from '../types/instance';

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

export function InstanceStatusBadge({ status }: { status: string }) {
  const presentation = instanceStatusPresentation[status.toLowerCase()];
  return <Badge variant="secondary" className={presentation?.className}>{presentation?.label ?? status}</Badge>;
}
