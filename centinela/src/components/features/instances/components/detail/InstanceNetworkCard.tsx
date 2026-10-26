import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCopyInstanceIp } from '../../hooks/useCopyInstanceIp';

export default function InstanceNetworkCard({ ip, onViewNetwork }: { ip?: string | null; onViewNetwork: () => void }) {
    const { copyIpAddress, isCopying, isCopied } = useCopyInstanceIp(ip ?? null);
    return <Card className={styles.networkCard}>
        <h2>Direcciones IP</h2>
        {ip ? <div className={styles.addressRow}>
            <button type="button" className={styles.ipButton} disabled={isCopying} title={isCopied ? 'IP copiada' : 'Copiar dirección IP'} onClick={() => void copyIpAddress()}>
                <span className={styles.addressDot} aria-hidden="true" />{ip}
            </button>
            <Badge variant="success">Primaria</Badge>
        </div> : <p className={styles.emptyAddress}>Sin dirección IP disponible.</p>}
        <Separator />
        <Button type="button" variant="ghost" className={styles.networkLink} onClick={onViewNetwork}>
            Ver configuración de red <ArrowRight className={styles.arrowIcon} aria-hidden="true" />
        </Button>
    </Card>;
}

const styles = {
    networkCard: 'gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm ring-0',
    addressRow: 'flex flex-wrap items-center justify-between gap-3',
    ipButton: 'flex min-w-0 items-center gap-3 break-all text-sm font-medium text-slate-950 hover:text-blue-600',
    addressDot: 'size-2.5 shrink-0 rounded-full bg-emerald-600',
    emptyAddress: 'text-sm text-slate-500',
    networkLink: 'h-auto justify-between px-0 py-1 text-blue-600',
    arrowIcon: 'size-4!',
};
