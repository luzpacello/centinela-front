import type {
  InstanceMetricsPayload,
} from './metrics.types';
import type { InstanceRef } from '../types/instance';

export function getMetricsWebSocketUrl(
  instanceRef: InstanceRef,
  ticket: string,
): string {
  const configuredBase =
    import.meta.env.VITE_API_BASE_URL || '/api';

  const apiBase = new URL(
    configuredBase,
    window.location.origin,
  );

  const protocol =
    apiBase.protocol === 'https:' ? 'wss:' : 'ws:';

  const basePath = apiBase.pathname.replace(/\/+$/, '');

  const url = new URL(
    `${basePath}/ws/instances/${encodeURIComponent(instanceRef)}/metrics`,
    `${protocol}//${apiBase.host}`,
  );

  url.searchParams.set('ticket', ticket);

  return url.toString();
}

export function parseMetricsMessage(
  raw: string,
): InstanceMetricsPayload | null {
  try {
    const value: unknown = JSON.parse(raw);

    if (!value || typeof value !== 'object') {
      return null;
    }

    const data = value as Record<string, unknown>;

    if (
      !(typeof data.vmid === 'string' && data.vmid.trim().length > 0) &&
      !(typeof data.vmid === 'number' && Number.isSafeInteger(data.vmid) && data.vmid > 0)
    ) {
      return null;
    }

    const timestamp = typeof data.timestamp === 'number'
      ? data.timestamp
      : typeof data.timestamp === 'string' ? Date.parse(data.timestamp) : NaN;
    if (!Number.isFinite(timestamp) || timestamp < 0 || timestamp > 8_640_000_000_000_000) return null;

    if (data.status === 'unavailable') {
      const error = data.error as
        | Record<string, unknown>
        | undefined;

      if (
        error?.errorCode !== 'PROXMOX_UNAVAILABLE' &&
        error?.errorCode !== 'PROXMOX_TIMEOUT'
      ) {
        return null;
      }

      if (typeof error.message !== 'string') return null;

      return data as unknown as InstanceMetricsPayload;
    }

    const validMetric = (metric: unknown) =>
      metric === null ||
      (typeof metric === 'number' && Number.isFinite(metric));

    if (
      !validMetric(data.cpu) ||
      !validMetric(data.mem) ||
      typeof data.cpu === 'undefined' ||
      typeof data.mem === 'undefined'
    ) {
      return null;
    }

    if (
      (typeof data.cpu === 'number' &&
        (data.cpu < 0 || data.cpu > 100)) ||
      (typeof data.mem === 'number' && data.mem < 0)
    ) {
      return null;
    }

    const optionalMetrics = ['maxmem', 'netin', 'netout', 'diskread', 'diskwrite', 'netInBps', 'netOutBps', 'diskReadBps', 'diskWriteBps'];
    if (optionalMetrics.some((key) => data[key] !== undefined && data[key] !== null
      && (typeof data[key] !== 'number' || !Number.isFinite(data[key]) || data[key] < 0))) return null;

    return data as unknown as InstanceMetricsPayload;
  } catch {
    return null;
  }
}
