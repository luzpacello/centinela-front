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

// Una muestra del histórico del host, ya normalizada a los tres porcentajes que
// dibuja el gráfico del Dashboard.
export interface NodeHistoryPoint {
    timestamp: number;
    cpuPercent: number;
    // El backend omite estos campos cuando el punto del RRD no trae su total
    // (maxmem/maxdisk): ausente significa "sin dato", no 0%.
    ramPercent?: number;
    storagePercent?: number;
}

// Serie histórica del host. El backend la arma desde el RRD de Proxmox y la
// cachea en Redis, así que el gráfico del Dashboard ya está formado al entrar en
// vez de arrancar de cero y esperar minutos a que se llene.
export function getNodeHistory(signal?: AbortSignal): Promise<NodeHistoryPoint[]> {
    return apiClient.get<NodeHistoryPoint[]>('node/history', { signal });
}
