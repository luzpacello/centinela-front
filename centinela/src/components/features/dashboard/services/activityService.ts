import { apiClient } from '@/services/apiClient';
import { HIDDEN_AUDIT_ACTIONS } from '@/utils/auditActionLabels';
import type { AuditDetalles } from '@/utils/auditDetalle';

export interface ActivityItem {
    id: string;
    usuarioId?: string | null;
    nombreUsuario?: string | null;
    fechaHora?: string | null;
    accion?: string | null;
    instanciaId?: string | null;
    instanciaNombre?: string | null;
    resultado?: string | null;
    detalles?: AuditDetalles;
}

export interface ActivityPage {
    total?: number;
    pagina?: number;
    items?: ActivityItem[];
}

// Últimos movimientos registrados en la auditoría del sistema.
// El endpoint requiere rol ADMIN. La consulta excluye en el SERVIDOR los eventos
// del canal de eventos (conexión y cierre): son ruido de transporte que se genera
// en cada visita y, filtrándolo solo en el cliente, ocupaba toda la ventana y
// dejaba el panel vacío. El filtro local queda como red de seguridad, para el caso
// en que el backend todavía no aplique el parámetro.
const ACTIVITY_SIZE = 5;
const AUDIT_FETCH_SIZE = 50;
// La auditoría guarda el despacho PENDIENTE y el resultado final como dos filas
// de la misma tarea. El Dashboard muestra solo el resultado para no duplicar
// cada acción; la vista completa de Auditoría conserva ambos registros.
const PENDING_RESULTS = new Set(['PENDIENTE', 'PENDING']);

export async function getRecentActivity(signal?: AbortSignal): Promise<ActivityPage> {
    const params = new URLSearchParams({
        pagina: '1',
        tamano: String(AUDIT_FETCH_SIZE),
        ordenarPor: 'fechaHora',
        direccion: 'desc',
        excluirAccion: HIDDEN_AUDIT_ACTIONS.join(','),
    });
    const page = await apiClient.get<ActivityPage>(`/admin/audit?${params.toString()}`, { signal });
    const ruido = new Set(HIDDEN_AUDIT_ACTIONS);
    const items = (page.items ?? [])
        .filter((item) => !ruido.has((item.accion ?? '').trim().toUpperCase()))
        .filter((item) => !PENDING_RESULTS.has((item.resultado ?? '').trim().toUpperCase()))
        .slice(0, ACTIVITY_SIZE);
    return { ...page, items };
}
