// El calendario trabaja con días locales; el backend interpreta las fechas sin
// hora en UTC. Explicitar el instante evita perder las últimas horas del día.
export function auditDateBoundary(value: string, endOfDay = false): string {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const boundary = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`);
    return Number.isNaN(boundary.getTime()) ? value : boundary.toISOString();
}
