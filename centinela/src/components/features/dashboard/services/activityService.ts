import { apiClient } from '@/services/apiClient';

export interface ActivityItem {
    id: string;
    usuarioId?: string | null;
    nombreUsuario?: string | null;
    fechaHora?: string | null;
    accion?: string | null;
    instanciaId?: string | null;
    instanciaNombre?: string | null;
    resultado?: string | null;
    detalles?: string | null;
}

export interface ActivityPage {
    total?: number;
    pagina?: number;
    items?: ActivityItem[];
}

// Últimos movimientos registrados en la auditoría del sistema.
// El endpoint requiere rol ADMIN. Se piden de más y se descartan los eventos
// de conexión del canal (se generan en cada visita y taparían lo importante).
const ACTIVITY_SIZE = 5;
const AUDIT_FETCH_SIZE = 20;
const NOISE_ACTIONS = new Set(['EVENTOS_CONEXION']);

export async function getRecentActivity(signal?: AbortSignal): Promise<ActivityPage> {
    const params = new URLSearchParams({
        pagina: '1',
        tamano: String(AUDIT_FETCH_SIZE),
        ordenarPor: 'fechaHora',
        direccion: 'desc',
    });
    const page = await apiClient.get<ActivityPage>(`/admin/audit?${params.toString()}`, { signal });
    const items = (page.items ?? [])
        .filter((item) => !NOISE_ACTIONS.has((item.accion ?? '').trim().toUpperCase()))
        .slice(0, ACTIVITY_SIZE);
    return { ...page, items };
}
