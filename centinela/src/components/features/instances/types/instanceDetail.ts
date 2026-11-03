export type InstanceDetailTab = 'resumen' | 'metrics' | 'recursos' | 'red' | 'snapshots';
export type InstanceMetricsTimeframe = 'live' | '2h' | '24h';
export type InstanceHistoricalMetricsTimeframe = Exclude<InstanceMetricsTimeframe, 'live'>;

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
    netInBps: number | null;
    netOutBps: number | null;
}

export interface InstanceResourceConfiguration {
    cores: number;
    ramMb: number;
}

export interface InstanceConfigurationResult {
    requiresReboot: boolean;
    message?: string;
}
