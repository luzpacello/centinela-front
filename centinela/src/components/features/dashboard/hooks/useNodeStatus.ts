import { useCallback, useEffect, useRef, useState } from 'react';
import { getNodeStatus, type NodeStatusResponse } from '../services/nodeStatusService';

const POLLING_INTERVAL_MS = 10_000;

export type NodeHealth = 'loading' | 'healthy' | 'warning' | 'inaccessible';

// Cantidad máxima de muestras que se conservan para las curvas de tendencia
// (72 muestras × 10 s = 12 minutos de histórico en vivo). Cuantas más muestras
// entren en el mismo ancho, más juntos quedan los puntos de la curva.
const HISTORY_LIMIT = 72;

export interface NodeStatusSample {
    cpu: number;
    ram: number;
    storage: number;
}

export function useNodeStatus() {
    const [data, setData] = useState<NodeStatusResponse | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<NodeStatusSample[]>([]);
    const [retryCount, setRetryCount] = useState(0);
    const [refetchCount, setRefetchCount] = useState(0);
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
                    setHistory((previous) => [
                        ...previous.slice(-(HISTORY_LIMIT - 1)),
                        { cpu: nextData.cpu.usagePercent, ram: nextData.ram.usagePercent, storage: nextData.storage.usagePercent },
                    ]);
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
    }, [retryCount, refetchCount]);

    const health: NodeHealth = error
        ? 'inaccessible'
        : !data
            ? 'loading'
            : data.cpu.usagePercent >= 70 || data.ram.usagePercent >= 70 || data.storage.usagePercent >= 70
                ? 'warning'
                : 'healthy';

    const retry = useCallback(() => setRetryCount((count) => count + 1), []);

    // Revalidación silenciosa: vuelve a consultar el nodo sin mostrar skeletons
    // (el estado de carga solo aparece cuando todavía no hay datos).
    const refetch = useCallback(() => setRefetchCount((count) => count + 1), []);

    return {
        data,
        error,
        health,
        loading,
        history,
        retry,
        refetch,
    };
}