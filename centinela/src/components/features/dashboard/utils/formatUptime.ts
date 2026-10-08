export function formatUptime(seconds: number): string {
    const totalMinutes = Math.floor(Math.max(0, Number.isFinite(seconds) ? seconds : 0) / 60);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    return [
        days > 0 ? `${days}d` : null,
        hours > 0 ? `${hours}h` : null,
        minutes > 0 || (days === 0 && hours === 0) ? `${minutes}m` : null,
    ].filter(Boolean).join(' ');
}