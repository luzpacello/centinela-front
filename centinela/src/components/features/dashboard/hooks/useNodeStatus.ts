import { useCallback, useEffect, useRef, useState } from 'react';
import { getNodeHistory, getNodeStatus, type NodeHistoryPoint, type NodeStatusResponse } from '../services/nodeStatusService';

const POLLING_INTERVAL_MS = 10_000;

export type NodeHealth = 'loading' | 'healthy' | 'warning' | 'inaccessible';

// Una hora de sondeos de diez segundos más el histórico inicial por minuto.
const HISTORY_LIMIT = 480;

export interface NodeStatusSample {
    timestamp: number;
    cpu: number;
    // Opcionales: el histórico del nodo no siempre trae RAM ni almacenamiento.
    ram?: number;
    storage?: number;
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
                    const time = Date.parse(nextData.fetchedAt);
                    setHistory((previous) => [
                        ...previous.filter((sample) => sample.timestamp !== time),
                        { timestamp: Number.isFinite(time) ? time : Date.now(), cpu: nextData?.cpu?.usagePercent ?? 0, ram: nextData?.ram?.usagePercent, storage: nextData?.storage?.usagePercent },
                    ].sort((a, b) => a.timestamp - b.timestamp).slice(-HISTORY_LIMIT));
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
            : (data?.cpu?.usagePercent ?? 0) >= 70 || (data?.ram?.usagePercent ?? 0) >= 70 || (data?.storage?.usagePercent ?? 0) >= 70
                ? 'warning'
                : 'healthy';

    const retry = useCallback(() => setRetryCount((count) => count + 1), []);

    // Revalidación silenciosa: vuelve a consultar el nodo sin mostrar skeletons
    // (el estado de carga solo aparece cuando todavía no hay datos).
    const refetch = useCallback(() => setRefetchCount((count) => count + 1), []);

    // El histórico rellena el pasado sin reemplazar las muestras del sondeo.
    useEffect(() => {
        const controller = new AbortController();

        void (async () => {
            try {
                const serie: unknown = await getNodeHistory(controller.signal);
                if (controller.signal.aborted) return;
                // La serie puede llegar como objeto de error o sin inicializar: sin
                // esta guarda, `serie.map` revienta dentro del updater de estado y
                // desmonta el Dashboard entero.
                const muestras: NodeHistoryPoint[] = Array.isArray(serie) ? serie : [];
                if (muestras.length === 0) return;
                setHistory((previous) => {
                    // Si coinciden en el tiempo, prevalece la muestra del sondeo.
                    const byTime = new Map<number, NodeStatusSample>();
                    for (const punto of muestras) {
                        const timestamp = punto.timestamp * 1000;
                        if (Number.isFinite(timestamp) && timestamp > 0) {
                            byTime.set(timestamp, { timestamp, cpu: punto.cpuPercent, ram: punto.ramPercent, storage: punto.storagePercent });
                        }
                    }
                    for (const sample of previous) byTime.set(sample.timestamp, sample);
                    return [...byTime.values()].sort((a, b) => a.timestamp - b.timestamp).slice(-HISTORY_LIMIT);
                });
            } catch {
                // Sin histórico el gráfico sigue funcionando con el sondeo.
            }
        })();

        return () => controller.abort();
    }, []);

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
