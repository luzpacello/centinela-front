import { auditActionLabel, HIDDEN_AUDIT_ACTIONS } from '@/utils/auditActionLabels';
import type { AuditActionOption, AuditEvent } from '../types/audit';

export function normalizeAuditResult(result?: string | null): string {
    const value = (result ?? '').toUpperCase();
    if (['SUCCESS', 'EXITO'].includes(value)) return 'SUCCESS';
    if (['FAILED', 'FALLA', 'FALLO', 'FALLIDO', 'ERROR'].includes(value)) return 'FAILED';
    if (['PENDING', 'PENDIENTE'].includes(value)) return 'PENDIENTE';
    return value;
}

export function buildAuditFilterOptions(records: AuditEvent[]) {
    const users = new Map<string, string>();
    const actions = new Map<string, Set<string>>();
    const resourceTypes = new Set<string>();
    for (const event of records) {
        if (event.usuarioId) users.set(event.usuarioId, event.nombreUsuario?.trim() || event.usuarioId);
        if (event.recursoTipo) resourceTypes.add(event.recursoTipo);
        const action = event.accion?.trim().toUpperCase();
        if (!action || HIDDEN_AUDIT_ACTIONS.includes(action)) continue;
        const label = auditActionLabel(action);
        const codes = actions.get(label) ?? new Set<string>();
        codes.add(action);
        actions.set(label, codes);
    }
    return {
        users: [...users.entries()].sort((first, second) => first[1].localeCompare(second[1], 'es')),
        actions: [...actions.entries()].map(([label, codes]): AuditActionOption => {
            const sortedCodes = [...codes].sort();
            return { label, value: sortedCodes[0], codes: sortedCodes };
        }).sort((first, second) => first.label.localeCompare(second.label, 'es')),
        resourceTypes: [...resourceTypes].sort(),
    };
}

export function filterAuditRecords(records: AuditEvent[], filters: { userId: string; actionCodes: string[]; resourceType: string; search: string }) {
    const search = filters.search.trim().toLocaleLowerCase('es');
    return records.filter((event) => (!filters.userId || event.usuarioId === filters.userId)
        && (!filters.actionCodes.length || filters.actionCodes.includes(event.accion?.trim().toUpperCase() ?? ''))
        && (!filters.resourceType || event.recursoTipo === filters.resourceType)
        && (!search || `${JSON.stringify(event)} ${auditActionLabel(event.accion)}`.toLocaleLowerCase('es').includes(search)))
        .sort((first, second) => (Date.parse(second.fechaHora ?? '') || 0) - (Date.parse(first.fechaHora ?? '') || 0));
}

export function countAuditResults(records: AuditEvent[]) {
    return {
        total: records.length,
        successes: records.filter((event) => normalizeAuditResult(event.resultado) === 'SUCCESS').length,
        failures: records.filter((event) => normalizeAuditResult(event.resultado) === 'FAILED').length,
    };
}
