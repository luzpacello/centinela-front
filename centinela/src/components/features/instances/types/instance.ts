export type InstanceType = 'VM' | 'LXC';
export type InstanceStatusFilter = 'all' | 'running' | 'stopped';
export type InstancePermissionLevel = 'FULL_ACCESS' | 'READ_ONLY';
// La API actual expone referencias opacas (inst_...), mientras que versiones
// anteriores del backend y algunos datos de prueba usan VMID numérico.
export type InstanceRef = string | number;

export interface InstanceActiveTask {
  tareaId: string;
  action: string;
  status: string;
}

// Estado de transición de una fila: una tarea activa mantiene el spinner y
// todos sus controles bloqueados hasta el TASK_FINISHED.
export interface InstanceTransition {
  isTransitioning: boolean;
  tareaId: string;
  action: string;
}

export interface InventoryInstance {
  id: InstanceRef;
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
  tareaId: string;
}
