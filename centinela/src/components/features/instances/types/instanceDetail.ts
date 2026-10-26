export type InstanceDetailTab = 'resumen' | 'recursos' | 'red' | 'snapshots';
export type InstanceMetricsTimeframe = '2h' | '24h';

export interface InstanceDetail {
    reference: string;
    name: string;
    type: 'VM' | 'LXC';
    node: string;
    status: string;
    cpuPercent: number | null;
    memoryUsedBytes: number | null;
    cores: number | null;
    memoryTotalBytes: number | null;
}

export interface InstanceMetricPoint {
    timestamp: number;
    cpuPercent: number | null;
    ramUsedBytes: number | null;
    ramTotalBytes: number | null;
    diskReadBps: number | null;
    diskWriteBps: number | null;
}

export interface InstanceResourceConfiguration {
    cores: number;
    ramMb: number;
}

export interface InstanceConfigurationResult {
    message?: string;
    requiresReboot: boolean;
}
