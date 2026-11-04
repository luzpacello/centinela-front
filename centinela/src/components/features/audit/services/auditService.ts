import type { AuditAction } from '@/utils/auditActionLabels';
import type { AuditResult } from '../types/audit';
import { getAccessToken } from '@/storage/tokenStorage';
import { ApiRequestError } from '@/services/apiClient';

export type AuditExportFormat = 'csv' | 'json';

export interface AuditFilterParams {
    desde?: string;
    hasta?: string;
    usuarioId?: string;
    accion?: AuditAction | '';
    recursoTipo?: string;
    resultado?: AuditResult | '';
    excluirAccion?: string[];
}

function buildFilename(format: AuditExportFormat): string {
    const now = new Date();
    const date = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
    ].join('');
    const time = [
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
    ].join('');
    return `auditoria_centinela_${date}_${time}.${format}`;
}

function filenameFromContentDisposition(header: string | null, format: AuditExportFormat): string {
    const encodedFilename = header?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    const quotedFilename = header?.match(/filename="([^"]+)"/i)?.[1];
    const unquotedFilename = header?.match(/filename=([^;]+)/i)?.[1]?.trim();
    let candidate = quotedFilename || unquotedFilename;
    if (encodedFilename) {
        try {
            candidate = decodeURIComponent(encodedFilename);
        } catch {
            candidate = undefined;
        }
    }
    const safeFilename = candidate
        ?.replace(/[/\\]/g, '_')
        .split('')
        .filter((character) => {
            const code = character.charCodeAt(0);
            return code >= 32 && code !== 127;
        })
        .join('')
        .trim();

    return safeFilename || buildFilename(format);
}

export async function exportAuditLogs(
    filters: AuditFilterParams,
    format: AuditExportFormat,
): Promise<{ blob: Blob; filename: string }> {
    const params = new URLSearchParams({ format });
    if (filters.desde) params.set('desde', filters.desde);
    if (filters.hasta) params.set('hasta', filters.hasta);
    if (filters.usuarioId) params.set('usuarioId', filters.usuarioId);
    if (filters.accion) params.set('accion', filters.accion);
    if (filters.recursoTipo) params.set('recursoTipo', filters.recursoTipo);
    if (filters.resultado) params.set('resultado', filters.resultado);
    filters.excluirAccion?.forEach((action) => params.append('excluirAccion', action));

    const base = (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
    const token = getAccessToken();
    let response: Response;
    try {
        response = await fetch(`${base}/admin/audit/export?${params.toString()}`, {
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: 'include',
        });
    } catch {
        throw new ApiRequestError('No se pudo conectar con el servidor. Revisá tu conexión e intentá nuevamente.');
    }

    if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const message = typeof body === 'object' && body !== null && 'message' in body
            && typeof body.message === 'string'
            ? body.message
            : 'No se pudo generar la exportación de auditoría.';
        throw new ApiRequestError(message, response.status);
    }

    const blob = await response.blob();
    return {
        blob,
        filename: filenameFromContentDisposition(response.headers.get('Content-Disposition'), format),
    };
}
