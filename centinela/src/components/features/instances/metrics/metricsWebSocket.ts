import type {
  InstanceMetricsPayload,
} from './metrics.types';

/*export function getMetricsWebSocketUrl(
  instanceRef: string,
  ticket: string,
): string {
  const configuredBase = import.meta.env.VITE_API_BASE_URL || '/api';
  const apiBase = new URL(configuredBase, window.location.origin);

  const protocol =
    apiBase.protocol === 'https:' ? 'wss:' : 'ws:';

  const url = new URL(
    `/ws/instances/${encodeURIComponent(instanceRef)}/metrics`,
    `${protocol}//${apiBase.host}`,
  );

  url.searchParams.set('ticket', ticket);

  return url.toString();
}*/

export function getMetricsWebSocketUrl(
  instanceRef: string,
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
      typeof data.vmid !== 'string' ||
      data.vmid.length === 0
    ) {
      return null;
    }

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

      if (
        typeof data.timestamp !== 'string' &&
        typeof data.timestamp !== 'number'
      ) {
        return null;
      }

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

    if (
      typeof data.timestamp !== 'string' &&
      typeof data.timestamp !== 'number'
    ) {
      return null;
    }

    return data as unknown as InstanceMetricsPayload;
  } catch {
    return null;
  }
}