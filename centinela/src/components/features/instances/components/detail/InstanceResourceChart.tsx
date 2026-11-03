import { useId, useState } from 'react';

interface InstanceResourceChartProps {
    title: string;
    samples: { timestamp: number; value: number | null }[];
    color: string;
    percentage?: boolean;
    formatValue?: (value: number) => string;
}

export default function InstanceResourceChart({ title, samples, color, percentage = true, formatValue }: InstanceResourceChartProps) {
    const gradientId = useId();
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const safeSamples = samples.filter((sample) => Number.isFinite(sample.timestamp))
        .map((sample) => ({ ...sample, value: typeof sample.value === 'number' && Number.isFinite(sample.value) && sample.value >= 0 ? sample.value : null }));
    const availableSamples = safeSamples.filter((sample) => sample.value !== null);
    if (availableSamples.length === 0) {
        return <div className={styles.emptyChart} role="status">Sin historial disponible</div>;
    }
    const maximum = percentage ? 100 : Math.max(1, ...availableSamples.map((sample) => sample.value!));
    const firstTimestamp = safeSamples[0].timestamp;
    const duration = Math.max(1, safeSamples[safeSamples.length - 1].timestamp - firstTimestamp);
    const segments: string[][] = [];
    let currentSegment: string[] = [];
    for (const sample of safeSamples) {
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
    const selectedSample = selectedIndex == null ? undefined : availableSamples[selectedIndex];

    return (
        <div>
        <svg viewBox="0 0 300 140" className={styles.chart} role="img" aria-label={`Historial de ${title}`} tabIndex={0}
            onFocus={() => setSelectedIndex(availableSamples.length - 1)} onBlur={() => setSelectedIndex(null)}
            onPointerLeave={() => setSelectedIndex(null)}
            onPointerMove={(event) => {
                const bounds = event.currentTarget.getBoundingClientRect();
                if (!bounds.width) return;
                const chartX = (event.clientX - bounds.left) / bounds.width * 300;
                const timestamp = firstTimestamp + Math.max(0, Math.min(1, (chartX - 40) / 250)) * duration;
                const nearest = availableSamples.reduce((closest, sample, index) => Math.abs(sample.timestamp - timestamp) < Math.abs(availableSamples[closest].timestamp - timestamp) ? index : closest, 0);
                setSelectedIndex(nearest);
            }}
            onKeyDown={(event) => {
                if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
                event.preventDefault();
                setSelectedIndex((index) => Math.max(0, Math.min(availableSamples.length - 1, (index ?? availableSamples.length - 1) + (event.key === 'ArrowLeft' ? -1 : 1))));
            }}>
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
        {selectedSample && <p role="status" className="text-center text-xs text-slate-500">{timeLabel(selectedSample.timestamp)} · {axisValue(selectedSample.value!)}</p>}
        </div>
    );
}

const styles = {
    chart: 'mt-5 h-36 w-full overflow-visible',
    emptyChart: 'mt-5 flex h-36 items-center justify-center text-xs text-slate-400',
    gridLine: 'stroke-slate-100',
    axisLabel: 'fill-slate-500 text-[9px]',
};
