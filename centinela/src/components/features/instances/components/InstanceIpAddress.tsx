import { useId } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCopyInstanceIp } from '../hooks/useCopyInstanceIp';

interface InstanceIpAddressProps {
  ip?: string | null;
  instanceName: string;
}

export function InstanceIpAddress({ ip, instanceName }: InstanceIpAddressProps) {
  const detectedIp = typeof ip === 'string' && ip.trim() ? ip.trim() : null;
  const { isCopied, isCopying, copyIpAddress } = useCopyInstanceIp(detectedIp);
  const tooltipId = useId();

  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <span>{detectedIp ?? 'No detectada'}</span>
      <div className="group/ip-copy relative">
        <Button type="button" variant="ghost" size="icon"
          aria-label={`Copiar IP de ${instanceName}`}
          aria-describedby={detectedIp ? tooltipId : undefined}
          title={isCopied ? '¡Copiado!' : 'Copiar IP'}
          disabled={!detectedIp || isCopying}
          onClick={() => void copyIpAddress()}>
          {isCopied ? <Check className="size-4!" /> : <Copy className="size-4!" />}
        </Button>
        {detectedIp && (
          <span id={tooltipId} role="tooltip"
            className={`pointer-events-none absolute right-0 bottom-full z-10 mb-1 rounded-md bg-slate-900 px-2 py-1 text-xs text-white ${isCopied ? 'block' : 'hidden group-hover/ip-copy:block group-focus-within/ip-copy:block'}`}>
            {isCopied ? '¡Copiado!' : 'Copiar IP'}
          </span>
        )}
      </div>
      <span role="status" className="sr-only">{isCopied ? '¡Copiado!' : ''}</span>
    </div>
  );
}
