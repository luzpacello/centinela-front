import { useEffect, useState } from 'react';
import { getNodeStatus, type NodeStatusResponse } from '@/components/features/dashboard/services/nodeStatusService';

const NODE_STATUS_REFRESH_MS = 10_000;

export function useCreationNodeStatus(isResourcesStep: boolean) {
    const [nodeStatus, setNodeStatus] = useState<NodeStatusResponse | null>(null);
    const [nodeStatusError, setNodeStatusError] = useState<string | null>(null);

    useEffect(() => {
        if (!isResourcesStep) return;

        const controller = new AbortController();
        let refreshTimer: ReturnType<typeof setTimeout> | undefined;

        async function refreshNodeStatus() {
            try {
                const response = await getNodeStatus(controller.signal);
                if (controller.signal.aborted) return;
                setNodeStatus(response);
                setNodeStatusError(null);
            } catch (error) {
                if (controller.signal.aborted) return;
                setNodeStatus(null);
                setNodeStatusError(error instanceof Error ? error.message : 'No se pudo consultar el estado del nodo.');
            } finally {
                if (!controller.signal.aborted) {
                    refreshTimer = setTimeout(() => void refreshNodeStatus(), NODE_STATUS_REFRESH_MS);
                }
            }
        }

        void refreshNodeStatus();
        return () => {
            controller.abort();
            if (refreshTimer) clearTimeout(refreshTimer);
        };
    }, [isResourcesStep]);

    return {
        nodeStatus,
        nodeStatusError,
        isLoadingNodeStatus: isResourcesStep && !nodeStatus && !nodeStatusError,
    };
}
