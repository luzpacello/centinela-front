export type InstanceType = 'VM' | 'LXC';
export type InstancePermissionLevel = 'FULL_ACCESS' | 'READ_ONLY';

export interface InstanceActiveTask {
  tareaId: string;
  action: string;
  status: string;
}

export interface InventoryInstance {
  id: number;
  name: string;
  type: InstanceType;
  node: string;
  status: string;
  ip?: string | null;
  cpuUsage?: number | null;
  ramUsage?: number | null;
  maxRam?: number | null;
  activeTask?: InstanceActiveTask | null;
  nivelAcceso?: InstancePermissionLevel | null;
}

export type InstancePowerAction = 'start' | 'stop';

export interface InstancePowerActionResponse {
  upid: string;
  tareaId?: string;
}
