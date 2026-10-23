import { useId } from 'react';

interface InstanceResourceChartProps {
    title: string;
    samples: { timestamp: number; value: number | null }[];
    color: string;
    percentage?: boolean;
    formatValue?: (value: number) => string;
}

export default function InstanceResourceChart({ title, samples, color, percentage = true, formatValue }: InstanceResourceChartProps) {
    const gradientId = useId();
    const availableSamples = samples.filter((sample) => sample.value !== null);
    if (availableSamples.length === 0) {
        return <div className={styles.emptyChart} role="status">Sin historial disponible</div>;
    }
    const maximum = percentage ? 100 : Math.max(1, ...availableSamples.map((sample) => sample.value!));
    const firstTimestamp = samples[0].timestamp;
    const duration = Math.max(1, samples[samples.length - 1].timestamp - firstTimestamp);
    const segments: string[][] = [];
    let currentSegment: string[] = [];
    for (const sample of samples) {
        if (sample.value === null) {
            if (currentSegment.length) segments.push(currentSegment);
            currentSegment = [];
        } else {
            const x = 40 + ((sample.timestamp - firstTimestamp) / duration) * 250;
            const y = 110 - (Math.max(0, Math.min(maximum, sample.value)) / maximum) * 100;
            currentSegment.push(`${x.toFixed(2)},${y.toFixed(2)}`);
        }
    }
    if (currentSegment.length) segments.push(currentSegment);
    const axisValue = (value: number) => percentage ? `${Math.round(value)}%` : formatValue?.(value) ?? String(value);
    const timeLabel = (timestamp: number) => new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit' }).format(timestamp);

    return (
        <svg viewBox="0 0 300 140" className={styles.chart} role="img" aria-label={`Historial de ${title}`}>
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.22" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.02" />
                </linearGradient>
            </defs>
            {[0, 0.5, 1].map((fraction) => (
                <g key={fraction}>
                    <line x1="40" x2="290" y1={110 - fraction * 100} y2={110 - fraction * 100} className={styles.gridLine} />
                    <text x="34" y={114 - fraction * 100} textAnchor="end" className={styles.axisLabel}>{axisValue(maximum * fraction)}</text>
                </g>
            ))}
            {segments.map((segment, index) => (
                <g key={index}>
                    {segment.length > 1 && <polygon points={`${segment[0].split(',')[0]},110 ${segment.join(' ')} ${segment[segment.length - 1].split(',')[0]},110`} fill={`url(#${gradientId})`} />}
                    <polyline points={segment.join(' ')} fill="none" stroke={color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
                    {segment.length === 1 && <circle cx={segment[0].split(',')[0]} cy={segment[0].split(',')[1]} r="2.5" fill={color} />}
                </g>
            ))}
            <text x="40" y="134" className={styles.axisLabel}>{timeLabel(firstTimestamp)}</text>
            <text x="290" y="134" textAnchor="end" className={styles.axisLabel}>{timeLabel(firstTimestamp + duration)}</text>
        </svg>
    );
}

const styles = {
    chart: 'mt-5 h-36 w-full overflow-visible',
    emptyChart: 'mt-5 flex h-36 items-center justify-center text-xs text-slate-400',
    gridLine: 'stroke-slate-100',
    axisLabel: 'fill-slate-500 text-[9px]',
};
