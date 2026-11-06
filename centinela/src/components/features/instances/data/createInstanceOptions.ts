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
    architecture: string;
    variant: string;
}

export function parseTemplateOption(volid: string): ParsedTemplate {
    const filename = volid.split('/').pop() ?? volid;

    const match = /(debian|ubuntu|alpine)[-_](\d+(?:\.\d+)?)/i.exec(filename);

    if (!match) return { id: volid, family: 'other', displayName: 'Otro', version: '' , architecture: '', variant: ''};

    const family = match[1].toLowerCase() as Exclude<ParsedTemplate['family'], 'other'>;
    const familyName = { debian: 'Debian', ubuntu: 'Ubuntu', alpine: 'Alpine' }[family];
    const version = family === 'debian' ? match[2].split('.')[0] : match[2];
    const architectureMatch = filename.match(/_(amd64|arm64|aarch64|i386|i686|x86_64)\b/i);
    const architecture = architectureMatch?.[1].toLocaleLowerCase() ?? '';
    const variantMatch = filename.match(/(?:^|[-_])(standard|default|minimal|server|netinst)(?=[-_.]|$)/i);
    const variant = variantMatch?.[1] ?? '';

    return { id: volid, family, displayName: `${familyName} ${version}`, version, architecture, variant: variant ? variant.charAt(0).toUpperCase() + variant.slice(1).toLocaleLowerCase() : '' };
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
    // La red de Centinela no tiene servidor DHCP: un contenedor creado en modo
    // DHCP queda sin dirección IP. El wizard pide la IP estática de entrada y
    // DHCP queda como elección explícita del usuario.
    modo: 'static' as const,
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
