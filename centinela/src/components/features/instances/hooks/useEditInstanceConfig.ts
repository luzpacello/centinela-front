import { useEffect, useRef, useState } from 'react';
import { getNodeStatus, type NodeStatusResponse } from '@/components/features/dashboard/services/nodeStatusService';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/utils/errorMapper';
import { assessInstanceConfiguration, type InstanceResourceValues } from '../validation/editInstanceConfigValidation';

interface EditInstanceConfigOptions {
    enabled: boolean;
    values: InstanceResourceValues;
    current: InstanceResourceValues;
    canEdit: boolean;
    onSave: () => Promise<boolean>;
}

export function useEditInstanceConfig(options: EditInstanceConfigOptions) {
    const { enabled, values, current } = options;
    const [nodeStatus, setNodeStatus] = useState<NodeStatusResponse | null>(null);
    const [nodeError, setNodeError] = useState<string | null>(null);
    const [isCheckingCapacity, setIsCheckingCapacity] = useState(false);
    const [refreshVersion, setRefreshVersion] = useState(0);
    const latestOptions = useRef(options);
    const submissionInProgress = useRef(false);
    const mounted = useRef(true);

    useEffect(() => { latestOptions.current = options; });
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    useEffect(() => {
        if (!enabled) return;
        const controller = new AbortController();
        let timer: ReturnType<typeof setTimeout> | undefined;
        async function loadCapacity() {
            try {
                const result = await getNodeStatus(controller.signal);
                if (controller.signal.aborted) return;
                setNodeStatus(result);
                setNodeError(null);
            } catch (error) {
                if (controller.signal.aborted) return;
                setNodeStatus(null);
                setNodeError(getErrorMessage(error));
            } finally {
                if (!controller.signal.aborted) timer = setTimeout(() => void loadCapacity(), 10_000);
            }
        }
        void loadCapacity();
        return () => { controller.abort(); if (timer) clearTimeout(timer); };
    }, [enabled, refreshVersion]);

    async function saveConfiguration(): Promise<boolean> {
        if (submissionInProgress.current || !latestOptions.current.canEdit) return false;
        submissionInProgress.current = true;
        setIsCheckingCapacity(true);
        try {
            // Revalidar antes de escribir: otros usuarios pueden consumir capacidad
            // mientras el formulario o su confirmación están abiertos.
            const freshNodeStatus = await getNodeStatus();
            if (!mounted.current) return false;
            setNodeStatus(freshNodeStatus);
            setNodeError(null);
            const latest = latestOptions.current;
            const validation = assessInstanceConfiguration(latest.values, latest.current, freshNodeStatus);
            if (!latest.canEdit) throw new Error('Ya no tenés permiso o la instancia tiene una operación en curso.');
            if (!validation.canSave) throw new Error(validation.cpuError || validation.ramError || validation.quotaError!);
            const saved = await latest.onSave();
            if (mounted.current) setRefreshVersion((version) => version + 1);
            return saved;
        } catch (error) {
            if (mounted.current) {
                const message = getErrorMessage(error);
                setNodeError(message);
                toast.add({ title: 'No se pudieron guardar los cambios', description: message, type: 'error' });
            }
            return false;
        } finally {
            submissionInProgress.current = false;
            if (mounted.current) setIsCheckingCapacity(false);
        }
    }

    return {
        nodeStatus, nodeError, isCheckingCapacity,
        isLoadingCapacity: enabled && !nodeStatus && !nodeError,
        assessment: assessInstanceConfiguration(values, current, nodeError ? null : nodeStatus),
        refreshCapacity: () => setRefreshVersion((version) => version + 1),
        saveConfiguration,
    };
}

export type InstanceConfigEditor = ReturnType<typeof useEditInstanceConfig>;
