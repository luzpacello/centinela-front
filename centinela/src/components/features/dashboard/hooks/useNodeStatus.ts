import { useEffect, useRef, useState } from 'react';
import { getNodeStatus, type NodeStatusResponse } from '../services/nodeStatusService';

const POLLING_INTERVAL_MS = 10_000;

export type NodeHealth = 'loading' | 'healthy' | 'warning' | 'inaccessible';

export function useNodeStatus() {
    const [data, setData] = useState<NodeStatusResponse | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [loading, setLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);
    const hasData = useRef(false);

    useEffect(() => {
        let disposed = false;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let activeController: AbortController | null = null;

        const clearTimer = () => {
            if (timer !== undefined) {
                clearTimeout(timer);
                timer = undefined;
            }
        };

        const scheduleNextPoll = () => {
            clearTimer();
            if (!disposed && document.visibilityState === 'visible') {
                timer = setTimeout(() => {
                    timer = undefined;
                    void poll();
                }, POLLING_INTERVAL_MS);
            }
        };

        const poll = async () => {
            if (disposed || document.visibilityState !== 'visible' || activeController) return;

            const controller = new AbortController();
            activeController = controller;
            setLoading(!hasData.current);

            try {
                const nextData = await getNodeStatus(controller.signal);
                if (!disposed && !controller.signal.aborted) {
                    hasData.current = true;
                    setData(nextData);
                    setError(null);
                }
            } catch (requestError) {
                if (!disposed && !controller.signal.aborted) {
                    setError(requestError instanceof Error ? requestError : new Error('No se pudo consultar el nodo.'));
                }
            } finally {
                if (activeController === controller) {
                    activeController = null;
                    if (!disposed) {
                        setLoading(false);
                        scheduleNextPoll();
                    }
                }
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                clearTimer();
                activeController?.abort();
                activeController = null;
                setLoading(!hasData.current);
                return;
            }

            clearTimer();
            void poll();
        };

        const handleFocus = () => {
            if (document.visibilityState === 'visible' && !activeController) {
                clearTimer();
                void poll();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);
        void poll();

        return () => {
            disposed = true;
            clearTimer();
            activeController?.abort();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [retryCount]);

    const health: NodeHealth = error
        ? 'inaccessible'
        : !data
            ? 'loading'
            : data.cpu.usagePercent >= 70 || data.ram.usagePercent >= 70 || data.storage.usagePercent >= 70
                ? 'warning'
                : 'healthy';

    return {
        data,
        error,
        health,
        loading,
        retry: () => setRetryCount((count) => count + 1),
    };
}