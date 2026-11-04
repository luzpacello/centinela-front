import { useEffect, useState } from 'react';
import { fetchAuditCatalog } from '../services/auditLogService';
import type { AuditEvent } from '../types/audit';

export function useAuditCatalog(enabled: boolean, fromDate: string, toDate: string) {
    const key = JSON.stringify([fromDate, toDate]);
    const [state, setState] = useState<{ key: string; records: AuditEvent[]; errorMessage: string | null }>({ key: '', records: [], errorMessage: null });
    const [refreshVersion, setRefreshVersion] = useState(0);

    useEffect(() => {
        if (!enabled) return;
        const controller = new AbortController();
        fetchAuditCatalog(fromDate, toDate, controller.signal)
            .then((records) => {
                if (!controller.signal.aborted) setState({ key, records, errorMessage: null });
            })
            .catch((error) => {
                if (!controller.signal.aborted) setState({
                    key, records: [], errorMessage: error instanceof Error ? error.message : 'No se pudieron cargar las opciones de auditoría.',
                });
            });
        return () => controller.abort();
    }, [enabled, fromDate, toDate, key, refreshVersion]);

    return {
        records: state.key === key ? state.records : [],
        isLoading: enabled && state.key !== key,
        errorMessage: state.key === key ? state.errorMessage : null,
        retry: () => { setState({ key: '', records: [], errorMessage: null }); setRefreshVersion((version) => version + 1); },
    };
}
