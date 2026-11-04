import { ApiRequestError, apiClient } from '@/services/apiClient';
import { HIDDEN_AUDIT_ACTIONS } from '@/utils/auditActionLabels';
import { AUDIT_HISTORY_START_DATE, type AuditEvent, type AuditPage } from '../types/audit';
import { auditDateBoundary } from '../utils/auditDateBoundary';

export async function fetchAuditPage(params: URLSearchParams, signal?: AbortSignal): Promise<AuditPage> {
    const page = await apiClient.get<AuditPage>(`/admin/audit?${params.toString()}`, { signal });
    if (!page || !Array.isArray(page.items)) throw new ApiRequestError('No se pudo interpretar el registro de auditoría.');
    return page;
}

// El contrato no expone búsqueda ni opciones globales. Se recorren sus páginas
// para preparar un índice completo del rango, independiente de la tabla visible.
export async function fetchAuditCatalog(fromDate: string, toDate: string, signal?: AbortSignal): Promise<AuditEvent[]> {
    const params = new URLSearchParams({ pagina: '1', tamano: '100', excluirAccion: HIDDEN_AUDIT_ACTIONS.join(','), ordenarPor: 'fechaHora', direccion: 'asc' });
    params.set('desde', auditDateBoundary(fromDate || AUDIT_HISTORY_START_DATE));
    if (toDate) params.set('hasta', auditDateBoundary(toDate, true));
    const firstPage = await fetchAuditPage(params, signal);
    const records = firstPage.items!;
    const actualPageSize = firstPage.limit ?? (records.length || 100);
    const totalPages = Math.ceil((firstPage.total ?? records.length) / actualPageSize);
    if (!Number.isFinite(totalPages) || actualPageSize < 1) throw new ApiRequestError('La paginación del registro de auditoría no es válida.');
    const uniqueRecords = new Map(records.map((event) => [event.id, event]));
    for (let pageNumber = 2; pageNumber <= totalPages; pageNumber += 1) {
        if (signal?.aborted) throw new DOMException('Consulta cancelada.', 'AbortError');
        params.set('pagina', String(pageNumber));
        const nextPage = await fetchAuditPage(params, signal);
        for (const event of nextPage.items!) uniqueRecords.set(event.id, event);
    }
    return [...uniqueRecords.values()];
}
