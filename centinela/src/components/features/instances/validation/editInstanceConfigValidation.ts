export interface InstanceResourceValues {
    cores: number | null;
    ramMb: number | null;
}

interface InstanceConfigHostCapacity {
    stale: boolean;
    allocatable?: { maxCpuCores: number; freeRamMb: number };
}

export function assessInstanceConfiguration(values: InstanceResourceValues, current: InstanceResourceValues, node: InstanceConfigHostCapacity | null) {
    const quota = node?.allocatable;
    const hasQuota = node?.stale === false && quota != null
        && Number.isSafeInteger(quota.maxCpuCores) && quota.maxCpuCores >= 1
        && Number.isSafeInteger(quota.freeRamMb) && quota.freeRamMb >= 0;
    const hasCurrentConfiguration = Number.isSafeInteger(current.cores) && current.cores! >= 1
        && Number.isSafeInteger(current.ramMb) && current.ramMb! >= 16;
    const cpuError = !Number.isSafeInteger(values.cores) || values.cores! < 1
        ? 'Ingresá un número entero de núcleos, como mínimo 1.'
        : hasQuota && values.cores! > quota!.maxCpuCores ? `El máximo del host es ${quota!.maxCpuCores} núcleos.` : null;
    const ramError = !Number.isSafeInteger(values.ramMb) || values.ramMb! < 16
        ? 'Ingresá una memoria entera de al menos 16 MB.' : null;
    const deltaRam = hasCurrentConfiguration && !ramError ? values.ramMb! - current.ramMb! : null;
    const exceedsRamQuota = hasQuota && deltaRam !== null && deltaRam > quota!.freeRamMb;
    const quotaError = !hasCurrentConfiguration ? 'No se pudo verificar la CPU y RAM actuales de la instancia.'
        : node?.stale ? 'La lectura del host está desactualizada. Esperá una lectura vigente para guardar.'
            : !hasQuota ? 'No se pudo verificar la capacidad disponible del host.'
                : exceedsRamQuota ? `El incremento solicitado (+${deltaRam} MB) excede la memoria disponible en el host (${quota!.freeRamMb} MB libres)` : null;
    return {
        cpuError, ramError, quotaError, deltaRam, exceedsRamQuota,
        maxCpuCores: hasQuota ? quota!.maxCpuCores : null,
        freeRamMb: hasQuota ? quota!.freeRamMb : null,
        canSave: !cpuError && !ramError && !quotaError,
    };
}
