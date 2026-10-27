import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from '@/components/ui/toast';
import { useEventSubscription } from '@/context/EventsContext';
import { getErrorMessage } from '@/utils/errorMapper';
import { fetchInstanceDetail, fetchInstanceMetrics, updateInstanceConfiguration } from '../services/instanceDetailService';
import type {
    InstanceDetail,
    InstanceMetricPoint,
    InstanceMetricsTimeframe,
    InstanceResourceConfiguration,
} from '../types/instanceDetail';

interface UseInstanceDetailOptions {
    onConfigurationSaved?: (configuration: Partial<InstanceResourceConfiguration>) => void;
}

export function useInstanceDetail(reference: string, inventoryStatus: string, options: UseInstanceDetailOptions = {}) {
    const [detail, setDetail] = useState<InstanceDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [metrics, setMetrics] = useState<InstanceMetricPoint[]>([]);
    const [metricsError, setMetricsError] = useState<string | null>(null);
    const [metricsLoading, setMetricsLoading] = useState(true);
    const [timeframe, setTimeframe] = useState<InstanceMetricsTimeframe>('2h');
    const [refreshVersion, setRefreshVersion] = useState(0);
    const [resourceDraft, setResourceDraft] = useState<Partial<InstanceResourceConfiguration>>({});
    const [pendingConfiguration, setPendingConfiguration] = useState<Partial<InstanceResourceConfiguration>>({});
    const [requiresReboot, setRequiresReboot] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const savingInProgress = useRef(false);
    const pendingConfigurationRef = useRef<Partial<InstanceResourceConfiguration>>({});

    const refresh = useCallback(() => setRefreshVersion((version) => version + 1), []);
    useEventSubscription({ tipo: 'TASK_FINISHED', recursoId: reference }, refresh);
    useEventSubscription({ tipo: 'INSTANCE_STATE_CHANGED', recursoId: reference }, refresh);

    useEffect(() => {
        const controller = new AbortController();
        let requestInProgress = false;
        async function loadDetail() {
            if (requestInProgress) return;
            requestInProgress = true;
            try {
                const result = await fetchInstanceDetail(reference, controller.signal);
                if (controller.signal.aborted) return;
                const pending = pendingConfigurationRef.current;
                setDetail({
                    ...result,
                    cores: pending.cores ?? result.cores,
                    memoryTotalBytes: pending.ramMb == null
                        ? result.memoryTotalBytes
                        : pending.ramMb * 1024 ** 2,
                });
                if (Object.keys(pending).length > 0
                    && (pending.cores === undefined || pending.cores === result.cores)
                    && (pending.ramMb === undefined || pending.ramMb * 1024 ** 2 === result.memoryTotalBytes)) {
                    pendingConfigurationRef.current = {};
                    setPendingConfiguration({});
                    setRequiresReboot(false);
                }
                setErrorMessage(null);
            } catch (error) {
                if (!controller.signal.aborted) setErrorMessage(getErrorMessage(error));
            } finally {
                requestInProgress = false;
                if (!controller.signal.aborted) setIsLoading(false);
            }
        }
        void loadDetail();
        const interval = window.setInterval(() => void loadDetail(), 30_000);
        return () => { controller.abort(); window.clearInterval(interval); };
    }, [reference, inventoryStatus, refreshVersion]);

    useEffect(() => {
        const controller = new AbortController();
        let requestInProgress = false;
        async function loadMetrics() {
            if (requestInProgress) return;
            requestInProgress = true;
            setMetricsLoading(true);
            try {
                const result = await fetchInstanceMetrics(reference, timeframe, controller.signal);
                if (controller.signal.aborted) return;
                setMetrics(result);
                setMetricsError(null);
            } catch (error) {
                if (!controller.signal.aborted) setMetricsError(getErrorMessage(error));
            } finally {
                requestInProgress = false;
                if (!controller.signal.aborted) setMetricsLoading(false);
            }
        }
        void loadMetrics();
        const interval = window.setInterval(() => void loadMetrics(), 30_000);
        return () => { controller.abort(); window.clearInterval(interval); };
    }, [reference, timeframe, refreshVersion]);

    const appliedConfiguration = {
        cores: pendingConfiguration.cores ?? detail?.cores ?? null,
        ramMb: pendingConfiguration.ramMb ?? (detail?.memoryTotalBytes == null ? null : detail.memoryTotalBytes / 1024 ** 2),
    };
    const editableConfiguration = {
        cores: resourceDraft.cores ?? appliedConfiguration.cores,
        ramMb: resourceDraft.ramMb ?? appliedConfiguration.ramMb,
    };
    const hasChanges = editableConfiguration.cores !== appliedConfiguration.cores
        || editableConfiguration.ramMb !== appliedConfiguration.ramMb;

    function updateResource(field: keyof InstanceResourceConfiguration, value: number) {
        setSaveError(null);
        setResourceDraft((draft) => ({ ...draft, [field]: value }));
    }

    function changeTimeframe(nextTimeframe: InstanceMetricsTimeframe) {
        if (nextTimeframe === timeframe) return;
        setMetrics([]);
        setMetricsLoading(true);
        setMetricsError(null);
        setTimeframe(nextTimeframe);
    }

    async function saveChanges(canSave: boolean) {
        if (!canSave || !hasChanges || savingInProgress.current || !detail) return false;
        savingInProgress.current = true;
        setIsSaving(true);
        setSaveError(null);
        try {
            const changes: Partial<InstanceResourceConfiguration> = {};
            if (editableConfiguration.cores !== appliedConfiguration.cores) changes.cores = editableConfiguration.cores!;
            if (editableConfiguration.ramMb !== appliedConfiguration.ramMb) changes.ramMb = editableConfiguration.ramMb!;
            const result = await updateInstanceConfiguration(reference, changes);
            pendingConfigurationRef.current = { ...pendingConfigurationRef.current, ...changes };
            setPendingConfiguration(pendingConfigurationRef.current);
            setDetail((current) => current ? {
                ...current,
                cores: changes.cores ?? current.cores,
                memoryTotalBytes: changes.ramMb == null ? current.memoryTotalBytes : changes.ramMb * 1024 ** 2,
            } : current);
            options.onConfigurationSaved?.(changes);
            setResourceDraft({});
            setRequiresReboot(result.requiresReboot);
            toast.add({
                title: result.requiresReboot ? 'Configuración guardada' : 'Recursos actualizados',
                description: result.requiresReboot
                    ? 'Configuración guardada. La máquina requiere reinicio para aplicar los nuevos recursos.'
                    : 'Recursos actualizados exitosamente.',
                type: result.requiresReboot ? 'warning' : 'success',
            });
            refresh();
            return true;
        } catch (error) {
            const message = getErrorMessage(error);
            setSaveError(message);
            toast.add({ title: 'No se pudieron guardar los cambios', description: message, type: 'error' });
            return false;
        } finally {
            savingInProgress.current = false;
            setIsSaving(false);
        }
    }

    return {
        detail, isLoading, errorMessage, metrics, metricsError, metricsLoading, timeframe,
        setTimeframe: changeTimeframe, refresh, editableConfiguration, updateResource, hasChanges, isSaving,
        saveChanges, saveError, requiresReboot, appliedConfiguration,
        resetResources: () => { setResourceDraft({}); setSaveError(null); },
    };
}
