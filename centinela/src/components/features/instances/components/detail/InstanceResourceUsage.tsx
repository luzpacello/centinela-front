import { Cpu, HardDrive, MemoryStick } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem } from '@/components/ui/combobox';
import type { InstanceDetail, InstanceMetricPoint, InstanceMetricsTimeframe } from '../../types/instanceDetail';
import { formatCpuUsage, formatMemoryBytes } from '../../utils/formatInstanceTelemetry';
import InstanceResourceChart from './InstanceResourceChart';

interface InstanceResourceUsageProps {
    detail: InstanceDetail;
    metrics: InstanceMetricPoint[];
    timeframe: InstanceMetricsTimeframe;
    onTimeframeChange: (timeframe: InstanceMetricsTimeframe) => void;
    isLoading: boolean;
    error: string | null;
    onRetry: () => void;
}

const timeframeOptions: { value: InstanceMetricsTimeframe; label: string }[] = [
    { value: '2h', label: 'Últimas 2 horas' },
    { value: '24h', label: 'Últimas 24 horas' },
];

export default function InstanceResourceUsage({ detail, metrics, timeframe, onTimeframeChange, isLoading, error, onRetry }: InstanceResourceUsageProps) {
    const selectedTimeframe = timeframeOptions.find((option) => option.value === timeframe)!;
    const lastDiskPoint = [...metrics].reverse().find((point) => point.diskReadBps !== null || point.diskWriteBps !== null);
    const diskBytesPerSecond = lastDiskPoint ? (lastDiskPoint.diskReadBps ?? 0) + (lastDiskPoint.diskWriteBps ?? 0) : null;
    const resourceMetrics = [
        {
            title: 'CPU', icon: Cpu, color: '#059669', iconClass: styles.cpuIcon,
            value: formatCpuUsage(detail.cpuPercent),
            description: detail.cores == null ? 'Capacidad no disponible' : `${detail.cores} vCPU asignadas`,
            samples: metrics.map((point) => ({ timestamp: point.timestamp, value: point.cpuPercent })),
            percentage: true,
        },
        {
            title: 'Memoria', icon: MemoryStick, color: '#2563eb', iconClass: styles.memoryIcon,
            value: detail.memoryUsedBytes == null ? '—' : formatMemoryBytes(detail.memoryUsedBytes),
            description: detail.memoryTotalBytes == null ? 'Capacidad no disponible' : `de ${formatMemoryBytes(detail.memoryTotalBytes)}`,
            samples: metrics.map((point) => ({
                timestamp: point.timestamp,
                value: point.ramUsedBytes === null || !point.ramTotalBytes ? null : point.ramUsedBytes / point.ramTotalBytes * 100,
            })),
            percentage: true,
        },
        {
            title: 'Disco', icon: HardDrive, color: '#f97316', iconClass: styles.diskIcon,
            value: diskBytesPerSecond === null ? '—' : formatDiskRate(diskBytesPerSecond),
            description: 'Lectura y escritura',
            samples: metrics.map((point) => ({
                timestamp: point.timestamp,
                value: point.diskReadBps === null && point.diskWriteBps === null
                    ? null : (point.diskReadBps ?? 0) + (point.diskWriteBps ?? 0),
            })),
            percentage: false,
        },
    ];

    return (
        <Card className={styles.usageCard}>
            <div className={styles.cardHeader}>
                <h2>Uso de recursos</h2>
                <div className={styles.timeframeField}>
                    <Combobox items={timeframeOptions} value={selectedTimeframe} onValueChange={(option) => option && onTimeframeChange(option.value)}>
                        <ComboboxInput aria-label="Período de las métricas" readOnly />
                        <ComboboxContent><ComboboxList>
                            {timeframeOptions.map((option) => <ComboboxItem key={option.value} value={option}>{option.label}</ComboboxItem>)}
                        </ComboboxList></ComboboxContent>
                    </Combobox>
                </div>
            </div>
            {error ? <div role="alert" className={styles.errorNotice}>
                <p>{error}</p><Button type="button" variant="outline" onClick={onRetry}>Reintentar</Button>
            </div> : <div className={styles.metricsGrid} aria-busy={isLoading}>
                {resourceMetrics.map(({ title, icon: Icon, color, iconClass, value, description, samples, percentage }) => (
                    <section key={title} className={styles.metricColumn}>
                        <div className={styles.metricHeading}><Icon className={iconClass} aria-hidden="true" /><h3>{title}</h3></div>
                        <p className={styles.metricValue}>{value}</p>
                        <p className={styles.metricDescription}>{description}</p>
                        {isLoading && metrics.length === 0
                            ? <p role="status" className={styles.loadingChart}>Cargando historial…</p>
                            : <InstanceResourceChart title={title} samples={samples} color={color} percentage={percentage} formatValue={formatDiskRate} />}
                    </section>
                ))}
            </div>}
        </Card>
    );
}

function formatDiskRate(bytes: number): string {
    if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB/s`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB/s`;
    return `${Math.round(bytes)} B/s`;
}

const styles = {
    usageCard: 'gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm ring-0',
    cardHeader: 'flex flex-wrap items-center justify-between gap-3',
    timeframeField: 'w-48',
    metricsGrid: 'grid min-w-0 grid-cols-1 divide-y divide-slate-100 md:grid-cols-3 md:divide-x md:divide-y-0',
    metricColumn: 'min-w-0 px-4 py-3 first:pl-0 last:pr-0',
    metricHeading: 'mb-2 flex items-center gap-3',
    cpuIcon: 'size-5 shrink-0 text-emerald-600',
    memoryIcon: 'size-5 shrink-0 text-blue-600',
    diskIcon: 'size-5 shrink-0 text-orange-500',
    metricValue: 'text-2xl font-semibold tracking-tight text-slate-950',
    metricDescription: 'mt-1 text-xs text-slate-500',
    loadingChart: 'mt-5 flex h-36 items-center justify-center text-xs text-slate-500',
    errorNotice: 'flex flex-wrap items-center justify-between gap-3 text-sm text-red-700',
};
