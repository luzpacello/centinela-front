// Tiempo relativo en castellano, al estilo de la pantalla final del Dashboard
// ("Hace 3 min", "Hace 1 hora", "Hace 2 días").
export function formatRelativeTime(value?: string | null): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
    if (minutes < 1) return 'Hace instantes';
    if (minutes < 60) return `Hace ${minutes} min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} hora${hours === 1 ? '' : 's'}`;

    const days = Math.floor(hours / 24);
    return `Hace ${days} día${days === 1 ? '' : 's'}`;
}
