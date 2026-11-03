import { Cpu, HardDrive, MemoryStick, Network } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem } from '@/components/ui/combobox';
import type { InstanceDetail, InstanceMetricPoint, InstanceMetricsTimeframe } from '../../types/instanceDetail';
import { formatCpuUsage, formatMemoryBytes, formatNetworkRate } from '../../utils/formatInstanceTelemetry';
import type { MetricsConnectionStatus } from '../../metrics/metrics.types';
import InstanceResourceChart from './InstanceResourceChart';

interface InstanceResourceUsageProps {
    detail: InstanceDetail;
    metrics: InstanceMetricPoint[];
    timeframe: InstanceMetricsTimeframe;
    onTimeframeChange: (timeframe: InstanceMetricsTimeframe) => void;
    isLoading: boolean;
    error: string | null;
    onRetry: () => void;
    connectionStatus?: MetricsConnectionStatus;
    isInstanceStopped?: boolean;
}

const timeframeOptions: { value: InstanceMetricsTimeframe; label: string }[] = [
    { value: 'live', label: 'En vivo' },
    { value: '2h', label: 'Últimas 2 horas' },
    { value: '24h', label: 'Últimas 24 horas' },
];

export default function InstanceResourceUsage({ detail, metrics, timeframe, onTimeframeChange, isLoading, error, onRetry, connectionStatus, isInstanceStopped = false }: InstanceResourceUsageProps) {
    const selectedTimeframe = timeframeOptions.find((option) => option.value === timeframe)!;
    const stopped = isInstanceStopped || detail.status.toLowerCase() === 'stopped'
        || (metrics.length > 0 && metrics.every((point) => point.cpuPercent == null && point.ramUsedBytes == null));
    const latestPoint = metrics.at(-1);
    const currentCpu = timeframe === 'live' && latestPoint ? latestPoint.cpuPercent : detail.cpuPercent;
    const currentMemory = timeframe === 'live' && latestPoint ? latestPoint.ramUsedBytes : detail.memoryUsedBytes;
    const lastNetworkPoint = [...metrics].reverse().find((point) => point.netInBps != null || point.netOutBps != null);
    const networkBytesPerSecond = lastNetworkPoint ? (lastNetworkPoint.netInBps ?? 0) + (lastNetworkPoint.netOutBps ?? 0) : null;
    const lastDiskPoint = [...metrics].reverse().find((point) => point.diskReadBps !== null || point.diskWriteBps !== null);
    const diskBytesPerSecond = lastDiskPoint ? (lastDiskPoint.diskReadBps ?? 0) + (lastDiskPoint.diskWriteBps ?? 0) : null;
    const resourceMetrics = stopped ? [] : [
        {
            title: 'CPU', icon: Cpu, color: '#059669', iconClass: styles.cpuIcon,
            value: formatCpuUsage(currentCpu),
            description: detail.cores == null ? 'Capacidad no disponible' : `${detail.cores} vCPU asignadas`,
            samples: metrics.map((point) => ({ timestamp: point.timestamp, value: point.cpuPercent })),
            percentage: true,
        },
        {
            title: 'Memoria', icon: MemoryStick, color: '#2563eb', iconClass: styles.memoryIcon,
            value: currentMemory == null ? '—' : formatMemoryBytes(currentMemory),
            description: detail.memoryTotalBytes == null ? 'Capacidad no disponible' : `de ${formatMemoryBytes(detail.memoryTotalBytes)}`,
            samples: metrics.map((point) => ({
                timestamp: point.timestamp,
                value: point.ramUsedBytes == null || !point.ramTotalBytes ? null : point.ramUsedBytes / point.ramTotalBytes * 100,
            })),
            percentage: true,
        },
        {
            title: 'Disco', icon: HardDrive, color: '#f97316', iconClass: styles.diskIcon,
            value: formatNetworkRate(diskBytesPerSecond),
            description: 'Lectura y escritura',
            samples: metrics.map((point) => ({
                timestamp: point.timestamp,
                value: point.diskReadBps === null && point.diskWriteBps === null
                    ? null : (point.diskReadBps ?? 0) + (point.diskWriteBps ?? 0),
            })),
            percentage: false,
        },
        {
            title: 'Tráfico de Red', icon: Network, color: '#7c3aed', iconClass: styles.networkIcon,
            value: formatNetworkRate(networkBytesPerSecond),
            description: 'Entrada y salida combinadas',
            samples: metrics.map((point) => ({
                timestamp: point.timestamp,
                value: point.netInBps == null && point.netOutBps == null
                    ? null : (point.netInBps ?? 0) + (point.netOutBps ?? 0),
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
            {timeframe === 'live' && connectionStatus && <p role="status" className={styles.metricDescription}>
                {connectionStatus === 'conectado' ? 'En vivo · Conectado' : connectionStatus === 'error' ? 'Conexión de métricas no disponible' : `${connectionStatus.charAt(0).toUpperCase()}${connectionStatus.slice(1)}…`}
            </p>}
            {stopped ? <div role="status" className={styles.loadingChart}>Instancia detenida</div>
            : error ? <div role="alert" className={styles.errorNotice}>
                <p>{error}</p><Button type="button" variant="outline" onClick={onRetry}>Reintentar</Button>
            </div> : <div className={styles.metricsGrid} aria-busy={isLoading}>
                {resourceMetrics.map(({ title, icon: Icon, color, iconClass, value, description, samples, percentage }) => (
                    <section key={title} className={styles.metricColumn}>
                        <div className={styles.metricHeading}><Icon className={iconClass} aria-hidden="true" /><h3>{title}</h3></div>
                        <p className={styles.metricValue}>{value}</p>
                        <p className={styles.metricDescription}>{description}</p>
                        {isLoading && metrics.length === 0
                            ? <p role="status" className={styles.loadingChart}>Cargando historial…</p>
                            : <InstanceResourceChart title={title} samples={samples} color={color} percentage={percentage} formatValue={formatNetworkRate} />}
                    </section>
                ))}
            </div>}
        </Card>
    );
}

const styles = {
    usageCard: 'gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm ring-0',
    cardHeader: 'flex flex-wrap items-center justify-between gap-3',
    timeframeField: 'w-48',
    metricsGrid: 'grid min-w-0 grid-cols-1 divide-y divide-slate-100 md:grid-cols-2 xl:grid-cols-4 md:divide-x md:divide-y-0',
    metricColumn: 'min-w-0 px-4 py-3 first:pl-0 last:pr-0',
    metricHeading: 'mb-2 flex items-center gap-3',
    cpuIcon: 'size-5 shrink-0 text-emerald-600',
    memoryIcon: 'size-5 shrink-0 text-blue-600',
    diskIcon: 'size-5 shrink-0 text-orange-500',
    networkIcon: 'size-5 shrink-0 text-violet-600',
    metricValue: 'text-2xl font-semibold tracking-tight text-slate-950',
    metricDescription: 'mt-1 text-xs text-slate-500',
    loadingChart: 'mt-5 flex h-36 items-center justify-center text-xs text-slate-500',
    errorNotice: 'flex flex-wrap items-center justify-between gap-3 text-sm text-red-700',
};
