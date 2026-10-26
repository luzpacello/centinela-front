import { apiClient, ApiRequestError } from '@/services/apiClient';
import type {
    InstanceConfigurationResult,
    InstanceDetail,
    InstanceMetricPoint,
    InstanceMetricsTimeframe,
    InstanceResourceConfiguration,
} from '../types/instanceDetail';

function instancePath(reference: string): string {
    if (!reference.trim()) throw new ApiRequestError('La referencia de la instancia no es válida.');
    return `/instances/${encodeURIComponent(reference)}`;
}

function readNonNegativeNumber(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

export async function fetchInstanceDetail(reference: string, signal?: AbortSignal): Promise<InstanceDetail> {
    const response = await apiClient.get<unknown>(instancePath(reference), { signal, expectedStatus: 200 });
    if (typeof response !== 'object' || response === null) {
        throw new ApiRequestError('No se pudo interpretar el detalle de la instancia.');
    }
    const detail = response as Record<string, unknown>;
    if (typeof detail.vmid !== 'string' || typeof detail.nombre !== 'string'
        || typeof detail.nodo !== 'string' || typeof detail.estado !== 'string'
        || (detail.tipo !== 'qemu' && detail.tipo !== 'lxc')) {
        throw new ApiRequestError('No se pudo interpretar el detalle de la instancia.');
    }
    const isRunning = detail.estado.toLowerCase() === 'running';
    return {
        reference: detail.vmid,
        name: detail.nombre,
        node: detail.nodo,
        type: detail.tipo === 'qemu' ? 'VM' : 'LXC',
        status: detail.estado.toLowerCase(),
        cpuPercent: isRunning ? readNonNegativeNumber(detail.cpu) : null,
        memoryUsedBytes: isRunning ? readNonNegativeNumber(detail.mem) : null,
        cores: readNonNegativeNumber(detail.maxCpu),
        memoryTotalBytes: readNonNegativeNumber(detail.maxMem),
    };
}

export async function fetchInstanceMetrics(
    reference: string,
    timeframe: InstanceMetricsTimeframe,
    signal?: AbortSignal,
): Promise<InstanceMetricPoint[]> {
    const response = await apiClient.get<unknown>(`${instancePath(reference)}/metrics?timeframe=${timeframe}`, {
        signal,
        expectedStatus: 200,
    });
    if (typeof response !== 'object' || response === null || !Array.isArray((response as Record<string, unknown>).data)) {
        throw new ApiRequestError('No se pudo interpretar el historial de recursos.');
    }
    return ((response as { data: unknown[] }).data).map((value): InstanceMetricPoint => {
        if (typeof value !== 'object' || value === null) {
            throw new ApiRequestError('No se pudo interpretar una muestra del historial.');
        }
        const point = value as Record<string, unknown>;
        if (typeof point.timestamp !== 'number' || !Number.isFinite(point.timestamp)) {
            throw new ApiRequestError('El historial contiene una fecha inválida.');
        }
        return {
            timestamp: point.timestamp * 1000,
            cpuPercent: readNonNegativeNumber(point.cpuPercent),
            ramUsedBytes: readNonNegativeNumber(point.ramUsedBytes),
            ramTotalBytes: readNonNegativeNumber(point.ramTotalBytes),
            diskReadBps: readNonNegativeNumber(point.diskReadBps),
            diskWriteBps: readNonNegativeNumber(point.diskWriteBps),
        };
    }).sort((first, second) => first.timestamp - second.timestamp);
}

export async function updateInstanceConfiguration(
    reference: string,
    configuration: Partial<InstanceResourceConfiguration>,
): Promise<InstanceConfigurationResult> {
    if ((configuration.cores === undefined && configuration.ramMb === undefined)
        || (configuration.cores !== undefined && (!Number.isInteger(configuration.cores) || configuration.cores < 1))
        || (configuration.ramMb !== undefined && (!Number.isInteger(configuration.ramMb) || configuration.ramMb < 16))) {
        throw new ApiRequestError('Ingresá una cantidad entera de CPU y una memoria de al menos 16 MiB.');
    }
    const response = await apiClient.request<unknown>(`${instancePath(reference)}/config`, {
        method: 'PUT',
        payload: configuration,
        expectedStatus: 200,
    });
    if (typeof response !== 'object' || response === null
        || typeof (response as Record<string, unknown>).requiresReboot !== 'boolean') {
        throw new ApiRequestError('No se pudo verificar la configuración aplicada. Actualizá el detalle antes de reintentar.');
    }
    const result = response as Record<string, unknown>;
    return {
        requiresReboot: result.requiresReboot as boolean,
        message: typeof result.message === 'string' ? result.message : undefined,
    };
}
