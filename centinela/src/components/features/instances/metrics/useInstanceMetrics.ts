
import { useEffect, useState } from 'react';

import { getWsTicket } from './metricsService';
import { getMetricsWebSocketUrl, parseMetricsMessage } from './metricsWebSocket';

import type {
  InstanceMetricPoint,
  InstanceMetricsUnavailableMessage,
  MetricsConnectionStatus,
  UseInstanceMetricsResult,
} from './metrics.types';

const INITIAL_BUFFER_SIZE = 30;
const VISIBILITY_PAUSE_MS = 60_000;
const INITIAL_RETRY_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 30_000;
const NULL_SAMPLES_TO_DETECT_STOPPED = 2;

function getTimestamp(value: string | number): number {
  if (typeof value === 'number') {
    return value < 1_000_000_000_000 ? value * 1000 : value;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function isTerminalClose(code: number, reason: string): boolean {
  if (code === 1000 && reason === 'INSTANCE_NOT_FOUND') {
    return true;
  }

  if (code !== 1008) {
    return false;
  }

  return [
    'LOGOUT',
    'SESSIONS_REVOKED',
    'USER_INACTIVE',
    'INSTANCE_ACCESS_DENIED',
  ].includes(reason);
}

function isUnavailableMessage(
  message: unknown,
): message is InstanceMetricsUnavailableMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    'status' in message &&
    message.status === 'unavailable'
  );
}

export function useInstanceMetrics(
  instanceRef: string | null | undefined,
  bufferSize = INITIAL_BUFFER_SIZE,
): UseInstanceMetricsResult {
  const [metrics, setMetrics] = useState<InstanceMetricPoint[]>([]);
  const [status, setStatus] =
    useState<MetricsConnectionStatus>('conectando');
  const [isInstanceStopped, setIsInstanceStopped] = useState(false);

  useEffect(() => {
    let disposed = false;
    let pausedByVisibility = false;

    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let visibilityTimer: ReturnType<typeof setTimeout> | undefined;

    let attemptId = 0;
    let retryCount = 0;
    let consecutiveNullSamples = 0;

    const capacity = Math.max(1, Math.floor(bufferSize) || 1);

    const clearRetryTimer = () => {
      if (retryTimer !== undefined) {
        clearTimeout(retryTimer);
        retryTimer = undefined;
      }
    };

    const clearVisibilityTimer = () => {
      if (visibilityTimer !== undefined) {
        clearTimeout(visibilityTimer);
        visibilityTimer = undefined;
      }
    };

    const scheduleReconnect = () => {
      if (
        disposed ||
        pausedByVisibility ||
        retryTimer !== undefined
      ) {
        return;
      }

      const delay = Math.min(
        INITIAL_RETRY_DELAY_MS * 2 ** retryCount,
        MAX_RETRY_DELAY_MS,
      );

      retryCount += 1;
      setStatus('reconectando');

      retryTimer = setTimeout(() => {
        retryTimer = undefined;
        void connect();
      }, delay);
    };

    const connect = async () => {
      if (disposed || pausedByVisibility) {
        return;
      }

      const currentAttempt = ++attemptId;

      setStatus(retryCount === 0 ? 'conectando' : 'reconectando');

      try {
        // Cada conexión o reconexión necesita un ticket nuevo.
        const ticket = await getWsTicket();

        if (
          disposed ||
          pausedByVisibility ||
          currentAttempt !== attemptId
        ) {
          return;
        }

        const url = getMetricsWebSocketUrl(instanceRef!, ticket);
        const currentSocket = new WebSocket(url);
        socket = currentSocket;

        currentSocket.onopen = () => {
          if (disposed || socket !== currentSocket) {
            return;
          }

          retryCount = 0;
          setStatus('conectado');
        };

        currentSocket.onmessage = (event: MessageEvent<string>) => {
          if (disposed || socket !== currentSocket) {
            return;
          }

          const message = parseMetricsMessage(event.data);

          if (!message || message.vmid !== instanceRef) {
            return;
          }

          // Un fallo puntual de Proxmox no implica que el socket
          // deba cerrarse ni que debamos inventar una muestra.
          if (isUnavailableMessage(message)) {
            return;
          }

          const cpu = message.cpu;
          const mem = message.mem;

          if (cpu === null && mem === null) {
            consecutiveNullSamples += 1;
            if (
              consecutiveNullSamples >=
              NULL_SAMPLES_TO_DETECT_STOPPED
            ) {
              setIsInstanceStopped(true);
            }
          } else {
            consecutiveNullSamples = 0;
            setIsInstanceStopped(false);
          }

          const point: InstanceMetricPoint = {
            timestamp: getTimestamp(message.timestamp),
            cpu,
            mem,
          };

          setMetrics((previous) =>
            [...previous, point].slice(-capacity),
          );
        };

        currentSocket.onerror = () => {
          if (disposed || socket !== currentSocket) {
            return;
          }

          setStatus('reconectando');

          // Invalidamos este socket para evitar que sus eventos
          // posteriores programen una segunda reconexión.
          socket = null;

          try {
            currentSocket.close(1000, 'WebSocket error');
          } catch {
            // El cierre puede fallar si el socket ya fue cerrado.
          }

          scheduleReconnect();
        };

        currentSocket.onclose = (event: CloseEvent) => {
          if (disposed || socket !== currentSocket) {
            return;
          }

          socket = null;

          if (pausedByVisibility) {
            return;
          }

          if (isTerminalClose(event.code, event.reason)) {
            setStatus('error');
            clearRetryTimer();
            return;
          }

          // EVENTS_UNAVAILABLE (1008), 1001 y cierres inesperados
          // requieren una conexión nueva y un ticket nuevo.
          scheduleReconnect();
        };
      } catch {
        if (
          disposed ||
          pausedByVisibility ||
          currentAttempt !== attemptId
        ) {
          return;
        }

        scheduleReconnect();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        clearVisibilityTimer();

        visibilityTimer = setTimeout(() => {
          visibilityTimer = undefined;

          if (
            disposed ||
            document.visibilityState !== 'hidden'
          ) {
            return;
          }

          pausedByVisibility = true;
          attemptId += 1;
          clearRetryTimer();

          const currentSocket = socket;
          socket = null;

          if (currentSocket) {
            currentSocket.onopen = null;
            currentSocket.onmessage = null;
            currentSocket.onerror = null;
            currentSocket.onclose = null;

            try {
              currentSocket.close(1000, 'Tab hidden');
            } catch {
              // No quedan recursos pendientes aunque el cierre falle.
            }
          }

          setStatus('desconectado');
        }, VISIBILITY_PAUSE_MS);

        return;
      }

      clearVisibilityTimer();

      if (pausedByVisibility) {
        pausedByVisibility = false;
        retryCount = 0;
        void connect();
      }
    };

    setMetrics([]);
    setIsInstanceStopped(false);
    setStatus('conectando');

    if (!instanceRef) {
      setStatus('error');
      return;
    }

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange,
    );

    void connect();

    return () => {
      disposed = true;
      attemptId += 1;

      clearRetryTimer();
      clearVisibilityTimer();

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange,
      );

      const currentSocket = socket;
      socket = null;

      if (currentSocket) {
        currentSocket.onopen = null;
        currentSocket.onmessage = null;
        currentSocket.onerror = null;
        currentSocket.onclose = null;

        try {
          currentSocket.close(1000, 'Component unmounted');
        } catch {
          // El socket puede haber sido cerrado previamente.
        }
      }
    };
  }, [instanceRef, bufferSize]);

  return {
    metrics,
    status,
    isInstanceStopped,
  };
}
