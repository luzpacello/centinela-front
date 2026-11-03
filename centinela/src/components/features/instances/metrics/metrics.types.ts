import type { InstanceRef } from '../types/instance';

export type MetricsConnectionStatus =
  | 'conectando'
  | 'conectado'
  | 'reconectando'
  | 'error'
  | 'desconectado';

export interface InstanceMetricPoint {
  timestamp: number;
  cpu: number | null;
  mem: number | null;
  ramTotalBytes: number | null;
  netInBps: number | null;
  netOutBps: number | null;
  diskReadBps: number | null;
  diskWriteBps: number | null;
}

export interface InstanceMetricsMessage {
  timestamp: string | number;
  vmid: InstanceRef;
  cpu: number | null;
  mem: number | null;
  maxmem?: number | null;
  netin?: number | null;
  netout?: number | null;
  diskread?: number | null;
  diskwrite?: number | null;
  netInBps?: number | null;
  netOutBps?: number | null;
  diskReadBps?: number | null;
  diskWriteBps?: number | null;
}

export interface InstanceMetricsUnavailableMessage {
  timestamp: string | number;
  vmid: InstanceRef;
  status: 'unavailable';
  error: {
    errorCode: 'PROXMOX_UNAVAILABLE' | 'PROXMOX_TIMEOUT';
    message: string;
  };
}

export type InstanceMetricsPayload =
  | InstanceMetricsMessage
  | InstanceMetricsUnavailableMessage;

export interface UseInstanceMetricsResult {
  metrics: InstanceMetricPoint[];
  status: MetricsConnectionStatus;
  isInstanceStopped: boolean;
  error: string | null;
}
