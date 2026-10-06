import { useEffect, useRef, useState } from 'react';
import { toast } from '@/components/ui/toast';

export function useCopyInstanceIp(ip: string | null) {
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const confirmationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (confirmationTimeout.current !== null) clearTimeout(confirmationTimeout.current);
  }, []);

  async function copyIpAddress() {
    if (!ip || isCopying) return;
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(ip);
      setCopiedIp(ip);
      if (confirmationTimeout.current !== null) clearTimeout(confirmationTimeout.current);
      confirmationTimeout.current = setTimeout(() => setCopiedIp(null), 2000);
    } catch {
      setCopiedIp(null);
      toast.add({
        title: 'No se pudo copiar la IP',
        description: 'Revisá los permisos del portapapeles e intentá nuevamente.',
        type: 'error',
      });
    } finally {
      setIsCopying(false);
    }
  }

  return { isCopied: ip !== null && copiedIp === ip, isCopying, copyIpAddress };
}
