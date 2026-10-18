
import type { InventoryInstance } from '@/components/features/instances/types/instance';

export const mockInstances: InventoryInstance[] = [
  {
    id: 100,
    name: 'centinela-demo-01',
    type: 'VM',
    node: 'pve-demo',
    status: 'running',
    ip: '192.168.1.100',
    cpuUsage: 24,
    ramUsage: 58,
    maxRam: 4096,
    nivelAcceso: 'FULL_ACCESS',
    activeTask: null,
  },
  {
    id: 101,
    name: 'centinela-demo-02',
    type: 'LXC',
    node: 'pve-demo',
    status: 'stopped',
    ip: null,
    cpuUsage: 0,
    ramUsage: 0,
    maxRam: 2048,
    nivelAcceso: 'READ_ONLY',
    activeTask: null,
  },
];
