import { Cpu, HardDrive, MemoryStick, SlidersHorizontal } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { InstanceDetail } from '../../types/instanceDetail';
import { formatMemoryBytes } from '../../utils/formatInstanceTelemetry';

export default function InstanceHardwareCard({ detail }: { detail: InstanceDetail }) {
    const hardwareRows = [
        { label: 'vCPU', icon: Cpu, value: detail.cores == null ? '—' : String(detail.cores) },
        { label: 'Memoria RAM', icon: MemoryStick, value: detail.memoryTotalBytes == null ? '—' : formatMemoryBytes(detail.memoryTotalBytes) },
        { label: 'Disco', icon: HardDrive, value: '—' },
        { label: 'Controlador', icon: SlidersHorizontal, value: '—' },
    ];
    return <Card className={styles.hardwareCard}>
        <h2>Hardware</h2>
        <dl className={styles.hardwareRows}>{hardwareRows.map(({ label, icon: Icon, value }) => (
            <div key={label} className={styles.hardwareRow}>
                <dt className={styles.hardwareLabel}><Icon className={styles.hardwareIcon} aria-hidden="true" />{label}</dt>
                <dd className={styles.hardwareValue}>{value}</dd>
            </div>
        ))}</dl>
    </Card>;
}

const styles = {
    hardwareCard: 'gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm ring-0',
    hardwareRows: 'grid gap-5',
    hardwareRow: 'flex items-start justify-between gap-3 text-sm',
    hardwareLabel: 'flex items-center gap-3 text-slate-500',
    hardwareIcon: 'size-4 shrink-0',
    hardwareValue: 'min-w-0 text-right font-medium text-slate-900',
};
