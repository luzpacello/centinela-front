import type { AuditDetalles } from '@/utils/auditDetalle';

export const AUDIT_HISTORY_START_DATE = '1970-01-01';

export interface AuditEvent {
    id: string;
    usuarioId?: string | null;
    nombreUsuario?: string | null;
    fechaHora?: string | null;
    accion?: string | null;
    recursoTipo?: string | null;
    recursoId?: string | number | null;
    instanciaId?: string | null;
    instanciaNombre?: string | null;
    resultado?: string | null;
    detalles?: AuditDetalles;
}

export interface AuditPage {
    total?: number;
    pagina?: number;
    limit?: number;
    items?: AuditEvent[];
}

export interface AuditActionOption {
    value: string;
    label: string;
    codes: string[];
}
