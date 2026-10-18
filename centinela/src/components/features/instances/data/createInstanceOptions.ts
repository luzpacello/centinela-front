import type {
    CreateInstanceDraft,
    InstanceCreationStep,
    InstanceType,
    InstanceTypeOption,
    OperatingSystemTemplateOption,
    SelectOption,
    StorageOption,
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

export const NODE_OPTIONS: SelectOption[] = [
    { value: 'pve01', label: 'pve01 (192.168.1.10)' },
    { value: 'pve02', label: 'pve02 (192.168.1.11)' },
];

export const NETWORK_BRIDGE_OPTIONS: SelectOption[] = [
    { value: 'vmbr0', label: 'vmbr0 (recomendado)' },
    { value: 'vmbr1', label: 'vmbr1 (red interna)' },
];

export const DEFAULT_NETWORK_CONFIGURATION = {
    bridge: 'vmbr0',
    modo: 'dhcp' as const,
};

export const OPERATING_SYSTEM_TEMPLATE_OPTIONS: Record<InstanceType, OperatingSystemTemplateOption[]> = {
    vm: [
        {
            value: 'local:iso/ubuntu-24.04.iso',
            label: 'Ubuntu 24.04 LTS',
            templateName: 'ubuntu-24.04-live-server',
            distribution: 'Ubuntu',
            operatingSystem: 'Linux',
            version: '24.04',
            size: '2.6 GB',
            date: '2024-04-25',
        },
        {
            value: 'local:iso/debian-12.iso',
            label: 'Debian 12',
            templateName: 'debian-12-netinst',
            distribution: 'Debian',
            operatingSystem: 'Linux',
            version: '12',
            size: '650 MB',
            date: '2024-02-10',
        },
    ],
    lxc: [
        {
            value: 'local:vztmpl/ubuntu-22.04-standard.tar.zst',
            label: 'Ubuntu 22.04 LXC (jammy)',
            templateName: 'ubuntu-22.04-standard',
            distribution: 'Ubuntu',
            operatingSystem: 'Linux',
            version: '22.04',
            size: '125 MB',
            date: '2024-04-23',
        },
        {
            value: 'local:vztmpl/debian-12-standard.tar.zst',
            label: 'Debian 12 LXC',
            templateName: 'debian-12-standard',
            distribution: 'Debian',
            operatingSystem: 'Linux',
            version: '12',
            size: '117 MB',
            date: '2024-03-15',
        },
        {
            value: 'local:vztmpl/alpine-3.19-default.tar.xz',
            label: 'Alpine Linux 3.19 LXC',
            templateName: 'alpine-3.19-default',
            distribution: 'Alpine Linux',
            operatingSystem: 'Linux',
            version: '3.19',
            size: '8 MB',
            date: '2024-02-10',
        },
        {
            value: 'local:vztmpl/centos-9-stream-default.tar.xz',
            label: 'CentOS 9 Stream LXC',
            templateName: 'centos-9-stream',
            distribution: 'CentOS',
            operatingSystem: 'Linux',
            version: '9',
            size: '130 MB',
            date: '2024-01-28',
        },
        {
            value: 'local:vztmpl/rocky-9-default.tar.xz',
            label: 'Rocky Linux 9 LXC',
            templateName: 'rocky-9-default',
            distribution: 'Rocky Linux',
            operatingSystem: 'Linux',
            version: '9',
            size: '126 MB',
            date: '2024-01-20',
        },
        {
            value: 'local:vztmpl/almalinux-9-default.tar.xz',
            label: 'AlmaLinux 9 LXC',
            templateName: 'almalinux-9-default',
            distribution: 'AlmaLinux',
            operatingSystem: 'Linux',
            version: '9',
            size: '126 MB',
            date: '2024-01-18',
        },
    ],
};

export const TEMPLATE_OPTIONS: Record<InstanceType, SelectOption[]> = {
    vm: OPERATING_SYSTEM_TEMPLATE_OPTIONS.vm.map(({ value, label }) => ({ value, label })),
    lxc: OPERATING_SYSTEM_TEMPLATE_OPTIONS.lxc.map(({ value, label }) => ({ value, label })),
};

export const STORAGE_OPTIONS: StorageOption[] = [
    { value: 'local-lvm', label: 'local-lvm', availableGb: 722.5, totalGb: 1850 },
    { value: 'local', label: 'local', availableGb: 84.2, totalGb: 100 },
];

export const NODE_RESOURCE_AVAILABILITY = {
    cpu: { used: 4.4, total: 20, percentage: 22 },
    memory: { usedGb: 28.6, totalGb: 64, percentage: 45 },
    storage: { usedTb: 1.22, totalTb: 2, percentage: 61 },
};

export const DEFAULT_RESOURCE_CONFIGURATION = {
    cores: 2,
    ramMb: 4096,
    discoGb: 32,
    storageId: 'local-lvm',
};

export const RESOURCE_LIMITS = {
    cores: { min: 1, max: 20, step: 1 },
    ramMb: { min: 512, max: 65536, step: 512 },
    discoGb: { min: 20, max: 722, step: 1 },
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
        bridge: DEFAULT_NETWORK_CONFIGURATION.bridge,
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

export function findOptionLabel(options: SelectOption[], value: string): string | undefined {
    return options.find((option) => option.value === value)?.label;
}
