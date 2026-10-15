import type {
    CreateInstanceDraft,
    InstanceCreationStep,
    InstanceType,
    InstanceTypeOption,
    SelectOption,
} from '@/components/features/instances/types/createInstance';

export const INSTANCE_CREATION_STEPS: InstanceCreationStep[] = [
    { title: 'General', description: 'Tipo y nombre' },
    { title: 'Recursos', description: 'CPU y memoria' },
    { title: 'Disco', description: 'Almacenamiento' },
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

export const NODE_OPTIONS: SelectOption[] = [
    { value: 'pve01', label: 'pve01 (192.168.1.10)' },
    { value: 'pve02', label: 'pve02 (192.168.1.11)' },
];

export const TEMPLATE_OPTIONS: Record<InstanceType, SelectOption[]> = {
    vm: [
        { value: 'local:iso/ubuntu-24.04.iso', label: 'Ubuntu 24.04 LTS' },
        { value: 'local:iso/debian-12.iso', label: 'Debian 12' },
    ],
    lxc: [
        { value: 'local:vztmpl/ubuntu-22.04-standard.tar.zst', label: 'Ubuntu 22.04 LXC (jammy)' },
        { value: 'local:vztmpl/debian-12-standard.tar.zst', label: 'Debian 12 LXC' },
    ],
};

export const INITIAL_INSTANCE_DRAFT: CreateInstanceDraft = {
    cores: null,
    descripcion: '',
    discoGb: null,
    nodo: '',
    nombre: '',
    password: '',
    ramMb: null,
    red: {
        bridge: '',
        firewall: null,
        gateway: '',
        ip: '',
        mascara: '',
        modo: null,
        vlan: null,
    },
    storageId: '',
    templateOso: '',
    tipo: null,
};

export function findOptionLabel(options: SelectOption[], value: string): string | undefined {
    return options.find((option) => option.value === value)?.label;
}
