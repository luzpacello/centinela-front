export type InstanceType = 'vm' | 'lxc';
export type InstanceNetworkMode = 'dhcp' | 'static';

export interface InstanceNetworkDraft {
    bridge: string;
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
    nodo: string;
    nombre: string;
    password: string;
    ramMb: number | null;
    red: InstanceNetworkDraft;
    storageId: string;
    templateOso: string;
    tipo: InstanceType | null;
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
