export type InstanceType = 'vm' | 'lxc';
export type InstanceNetworkMode = 'dhcp' | 'static';

export interface InstanceNetworkDraft {
    firewall: boolean | null;
    gateway: string;
    ip: string;
    mascara: string;
    modo: InstanceNetworkMode | null;
    vlan: number | null;
}

export interface CreateInstanceDraft {
    cores: number | null;
    descripcion: string;
    discoGb: number | null;
    nombre: string;
    password: string;
    ramMb: number | null;
    red: InstanceNetworkDraft;
    storageId: string;
    templateOso: string;
    tipo: InstanceType | null;
}

export interface CreateInstancePayload {
    cores: number;
    descripcion: string;
    discoGb: number;
    nodo?: string;
    nombre: string;
    password: string;
    ramMb: number;
    red: {
        bridge?: string;
        firewall: boolean;
        gateway: string;
        ip: string;
        mascara: string;
        modo: InstanceNetworkMode;
        vlan: number;
    };
    storageId: string;
    templateOso: string;
    tipo: InstanceType;
}

export interface CreateInstanceResponse {
    vmid: import('./instance').InstanceRef;
    tareaId: string;
}

export interface InstanceTypeOption {
    type: InstanceType;
    title: string;
    description: string;
}

export interface SelectOption {
    value: string;
    label: string;
}

export interface StorageOption extends SelectOption {
    availableGb: number;
    totalGb: number;
    availableLabel: string;
    totalLabel: string;
    type: string;
    contentTypes: string[];
}

export interface OperatingSystemTemplateOption extends SelectOption {
    type: 'ISO' | 'LXC_TEMPLATE';
    templateName: string;
    distribution: string;
    operatingSystem: string;
    version: string;
    size: string;
    date: string;
}

export interface InstanceCreationStep {
    title: string;
    description: string;
}

export type UpdateCreateInstanceField = <Field extends keyof CreateInstanceDraft>(
    field: Field,
    value: CreateInstanceDraft[Field],
) => void;

export type UpdateInstanceNetworkField = <Field extends keyof InstanceNetworkDraft>(
    field: Field,
    value: InstanceNetworkDraft[Field],
) => void;
