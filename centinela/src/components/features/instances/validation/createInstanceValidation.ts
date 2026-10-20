import type {
    CreateInstanceDraft,
    InstanceNetworkDraft,
    OperatingSystemTemplateOption,
    StorageOption,
} from '../types/createInstance';

const IPV4_OCTET = '(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)';
const IPV4_PATTERN = new RegExp(`^${IPV4_OCTET}(?:\\.${IPV4_OCTET}){3}$`);

export function isValidIpv4(value: string): boolean {
    return IPV4_PATTERN.test(value.trim());
}

export function isValidStaticNetwork(network: InstanceNetworkDraft): boolean {
    const prefix = network.mascara.trim();
    return isValidIpv4(network.ip)
        && /^\d{1,2}$/.test(prefix)
        && Number(prefix) <= 32
        && isValidIpv4(network.gateway);
}

interface CreationCatalog {
    storages: StorageOption[];
    templates: OperatingSystemTemplateOption[];
    isLoadingCatalog: boolean;
    catalogError: string | null;
}

export function getCreateInstanceStepError(
    step: number,
    draft: CreateInstanceDraft,
    catalog: CreationCatalog,
): string | null {
    if (step === 1) {
        return draft.tipo && draft.nombre.trim()
            ? null
            : 'Seleccioná un tipo e ingresá un nombre para la instancia.';
    }

    if (step === 2) {
        if (!Number.isSafeInteger(draft.cores) || (draft.cores ?? 0) <= 0
            || !Number.isSafeInteger(draft.ramMb) || (draft.ramMb ?? 0) <= 0
            || !Number.isSafeInteger(draft.discoGb) || (draft.discoGb ?? 0) <= 0) {
            return 'Completá los recursos de CPU, memoria y disco.';
        }
        if (catalog.isLoadingCatalog) return 'Se están cargando los almacenamientos disponibles.';
        if (catalog.catalogError) return catalog.catalogError;
        if (!catalog.storages.some((storage) => storage.value === draft.storageId)) {
            return 'Seleccioná un almacenamiento disponible.';
        }
        return null;
    }

    if (step === 3) {
        return draft.red.modo === 'static' && !isValidStaticNetwork(draft.red)
            ? 'Ingresá una IP IPv4 válida, un prefijo CIDR entre 0 y 32 y una puerta de enlace válida.'
            : null;
    }

    if (step === 4) {
        if (catalog.isLoadingCatalog) return 'Se están cargando las imágenes disponibles.';
        if (catalog.catalogError) return catalog.catalogError;
        return catalog.templates.some((template) => template.value === draft.templateOso
            && template.type === (draft.tipo === 'vm' ? 'ISO' : 'LXC_TEMPLATE'))
            ? null
            : 'Seleccioná una imagen compatible con el tipo de instancia.';
    }

    return null;
}

export function getCreateInstanceDraftError(
    draft: CreateInstanceDraft,
    catalog: CreationCatalog,
): string | null {
    for (let step = 1; step <= 4; step += 1) {
        const error = getCreateInstanceStepError(step, draft, catalog);
        if (error) return error;
    }
    return null;
}
