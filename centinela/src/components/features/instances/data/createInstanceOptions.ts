import type {
    CreateInstanceDraft,
    InstanceCreationStep,
    InstanceTypeOption,
} from '@/components/features/instances/types/createInstance';

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
