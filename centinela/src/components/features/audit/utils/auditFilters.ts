import { AUDIT_ACTION_OPTIONS, auditActionLabel } from '@/utils/auditActionLabels';
import type { AuditEvent, AuditResult } from '../types/audit';

export function isAuditResult(result: unknown): result is AuditResult {
    return result === 'EXITO' || result === 'FALLA' || result === 'PENDIENTE';
}

export function buildAuditFilterOptions(records: AuditEvent[]) {
    const users = new Map<string, string>();
    const actions = new Set<string>();
    const resourceTypes = new Set<string>();
    for (const event of records) {
        if (event.usuarioId) users.set(event.usuarioId, event.nombreUsuario?.trim() || event.usuarioId);
        if (event.recursoTipo) resourceTypes.add(event.recursoTipo);
        const action = event.accion?.trim().toUpperCase();
        if (action) actions.add(action);
    }
    return {
        users: [...users.entries()].sort((first, second) => first[1].localeCompare(second[1], 'es')),
        actions: AUDIT_ACTION_OPTIONS.filter((option) => actions.has(option.value))
            .sort((first, second) => first.label.localeCompare(second.label, 'es')),
        resourceTypes: [...resourceTypes].sort(),
    };
}

export function filterAuditRecords(records: AuditEvent[], filters: { userId: string; action: string; resourceType: string; search: string }) {
    const search = filters.search.trim().toLocaleLowerCase('es');
    return records.filter((event) => (!filters.userId || event.usuarioId === filters.userId)
        && (!filters.action || event.accion === filters.action)
        && (!filters.resourceType || event.recursoTipo === filters.resourceType)
        && (!search || `${JSON.stringify(event)} ${auditActionLabel(event.accion)}`.toLocaleLowerCase('es').includes(search)))
        .sort((first, second) => (Date.parse(second.fechaHora ?? '') || 0) - (Date.parse(first.fechaHora ?? '') || 0));
}

export function countAuditResults(records: AuditEvent[]) {
    return {
        total: records.length,
        successes: records.filter((event) => event.resultado === 'EXITO').length,
        failures: records.filter((event) => event.resultado === 'FALLA').length,
    };
}
