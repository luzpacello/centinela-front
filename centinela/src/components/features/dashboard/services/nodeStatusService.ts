import { apiClient } from '@/services/apiClient';

export interface NodeStatusResponse {
    cpu: {
        usagePercent: number;
        cores: number;
    };
    ram: {
        usedGb: number;
        totalGb: number;
        usagePercent: number;
    };
    storage: {
        usedGb: number;
        totalGb: number;
        usagePercent: number;
    };
    uptimeSeconds: number;
    instancesSummary: {
        vms: { running: number; stopped: number; paused: number; total: number };
        lxc: { running: number; stopped: number; paused: number; total: number };
    };
    stale: boolean;
    fetchedAt: string;
}

export function getNodeStatus(signal?: AbortSignal): Promise<NodeStatusResponse> {
    return apiClient.get<NodeStatusResponse>('node/status', { signal });
}