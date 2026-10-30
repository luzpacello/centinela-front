import type {
    CreateInstanceDraft,
    InstanceCreationStep,
    InstanceTypeOption,
} from '@/components/features/instances/types/createInstance';

export interface ParsedTemplate {
    id: string;
    family: 'debian' | 'ubuntu' | 'alpine' | 'other';
    displayName: string;
    version: string;
}

export function parseTemplateOption(volid: string): ParsedTemplate {
    const filename = volid.slice(volid.lastIndexOf('/') + 1);
    const match = /(?:^|[^a-z0-9])(debian|ubuntu|alpine)(?=$|[^a-z])/i.exec(filename);
    if (!match) return { id: volid, family: 'other', displayName: 'Otro', version: '' };

    const family = match[1].toLowerCase() as Exclude<ParsedTemplate['family'], 'other'>;
    const familyName = { debian: 'Debian', ubuntu: 'Ubuntu', alpine: 'Alpine' }[family];
    const suffix = filename.slice(match.index + match[0].length);
    const versionMatch = /^[-_.\s]+(?:server[-_.\s]+)?(\d+)(?:\.(\d+))?/i.exec(suffix);
    const version = versionMatch
        ? family !== 'debian' && versionMatch[2] ? `${versionMatch[1]}.${versionMatch[2]}` : versionMatch[1]
        : '';

    return { id: volid, family, displayName: version ? `${familyName} ${version}` : familyName, version };
}

export const INSTANCE_CREATION_STEPS: InstanceCreationStep[] = [
    { title: 'General', description: 'Tipo y nombre' },
    { title: 'Recursos', description: 'CPU, RAM y almacenamiento' },
    { title: 'Red', description: 'Conectividad' },
    { title: 'Sistema operativo', description: 'Template y configuración' },
    { title: 'Resumen', description: 'Revisar y crear' },
];

export const INSTANCE_TYPE_OPTIONS: InstanceTypeOption[] = [
    {
        type: 'vm',
        title: 'Máquina virtual (VM)',
        description: 'Crea una máquina virtual completa con un sistema operativo.',
    },
    {
        type: 'lxc',
        title: 'Contenedor (LXC)',
        description: 'Crea un contenedor aislado y ligero basado en el sistema operativo.',
    },
];

export const DEFAULT_NETWORK_CONFIGURATION = {
    modo: 'dhcp' as const,
};

export const DEFAULT_RESOURCE_CONFIGURATION = {
    cores: 2,
    ramMb: 4096,
    discoGb: 32,
};

export const RESOURCE_LIMITS = {
    cores: { min: 1, step: 1 },
    ramMb: { min: 512, step: 512 },
    discoGb: { min: 20, step: 1 },
};

export const INITIAL_INSTANCE_DRAFT: CreateInstanceDraft = {
    cores: null,
    descripcion: '',
    discoGb: null,
    nombre: '',
    password: '',
    ramMb: null,
    red: {
        firewall: null,
        gateway: '',
        ip: '',
        mascara: '',
        modo: DEFAULT_NETWORK_CONFIGURATION.modo,
        vlan: null,
    },
    storageId: '',
    templateOso: '',
    tipo: null,
};
