export function formatCpuUsage(usage?: number | null): string {
  if (typeof usage !== 'number' || !Number.isFinite(usage) || usage < 0) return '—';
  return new Intl.NumberFormat('es-AR', { style: 'percent', maximumFractionDigits: 1 }).format(usage);
}

function formatMemoryBytes(bytes: number): string {
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  const unitIndex = bytes === 0 ? 0 : Math.max(0, Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1));
  const value = bytes / 1024 ** unitIndex;
  return `${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(value)} ${units[unitIndex]}`;
}

export function formatRamUsage(usage?: number | null, maximum?: number | null): string {
  if (typeof usage !== 'number' || !Number.isFinite(usage) || usage < 0) return '—';
  const formattedUsage = formatMemoryBytes(usage);
  return typeof maximum === 'number' && Number.isFinite(maximum) && maximum > 0
    ? `${formattedUsage} / ${formatMemoryBytes(maximum)}`
    : formattedUsage;
}
