export type InstanceType = 'VM' | 'LXC';
export type InstancePermissionLevel = 'FULL_ACCESS' | 'READ_ONLY';

export interface InstanceActiveTask {
  tareaId: string;
  action: string;
  status: string;
}

// Estado de transición de una fila: mientras haya una tarea RUNNING la fila
// mantiene el spinner y todos sus controles bloqueados hasta el TASK_FINISHED.
export interface InstanceTransition {
  isTransitioning: boolean;
  tareaId: string;
  action: string;
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

export type InstancePowerAction = 'start' | 'shutdown' | 'reboot' | 'stop';

export interface InstancePowerActionResponse {
  upid: string;
  tareaId?: string;
}
