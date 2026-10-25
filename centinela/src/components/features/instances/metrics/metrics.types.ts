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
}

export interface InstanceMetricsMessage {
  timestamp: string | number;
  vmid: string;
  cpu: number | null;
  mem: number | null;
}

export interface InstanceMetricsUnavailableMessage {
  timestamp: string | number;
  vmid: string;
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
}