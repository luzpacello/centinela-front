export function formatCpuUsage(usage?: number | null): string {
  if (typeof usage !== 'number' || !Number.isFinite(usage) || usage < 0) return '—';
  return new Intl.NumberFormat('es-AR', { style: 'percent', maximumFractionDigits: 1 }).format(usage / 100);
}

export function formatMemoryBytes(bytes: number): string {
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export function formatNetworkRate(bytesPerSecond?: number | null): string {
  if (typeof bytesPerSecond !== 'number' || !Number.isFinite(bytesPerSecond) || bytesPerSecond < 0) return '—';
  if (bytesPerSecond >= 1024 ** 2) return `${(bytesPerSecond / 1024 ** 2).toFixed(1)} MB/s`;
  if (bytesPerSecond >= 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  return `${Math.round(bytesPerSecond)} B/s`;
}

export function formatRamUsage(usage?: number | null, maximum?: number | null): string {
  if (typeof usage !== 'number' || !Number.isFinite(usage) || usage < 0) return '—';
  const formattedUsage = formatMemoryBytes(usage);
  return typeof maximum === 'number' && Number.isFinite(maximum) && maximum > 0
    ? `${formattedUsage} / ${formatMemoryBytes(maximum)}`
    : formattedUsage;
}
