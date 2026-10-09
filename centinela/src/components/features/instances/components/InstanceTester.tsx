import { useState } from 'react';
import InstanceAction from './InstanceAction';
import type { InventoryInstance, InstancePowerAction } from '../types/instance';

// Datos de prueba iniciales basados en tus tipos oficiales
const INITIAL_INSTANCES: InventoryInstance[] = [
  {
    id: 1,
    name: 'servidor-web-produccion',
    type: 'VM',
    node: 'pve-node-01',
    status: 'running',
    ip: '192.168.1.50',
    cpuUsage: 12.5,
    ramUsage: 2048,
    maxRam: 8192,
    nivelAcceso: 'FULL_ACCESS',
    activeTask: null,
  },
  {
    id: 2,
    name: 'base-datos-staging',
    type: 'VM',
    node: 'pve-node-02',
    status: 'stopped',
    ip: '192.168.1.51',
    cpuUsage: 0,
    ramUsage: 0,
    maxRam: 4096,
    nivelAcceso: 'FULL_ACCESS',
    activeTask: null,
  },
  {
    id: 3,
    name: 'worker-procesamiento',
    type: 'LXC',
    node: 'pve-node-01',
    status: 'running',
    ip: '192.168.1.55',
    cpuUsage: 85.2,
    ramUsage: 1024,
    maxRam: 2048,
    nivelAcceso: 'READ_ONLY', // Para probar el bloqueo de permisos
    activeTask: null,
  },
];

export default function InstanceTester() {
  const [instances, setInstances] = useState<InventoryInstance[]>(INITIAL_INSTANCES);
  // Mapa para simular transiciones pendientes por ID de instancia
  const [pendingActions, setPendingActions] = useState<Record<number, boolean>>({});

  // Simula la aceptación de una acción de energía (start, stop, reboot, shutdown)
  const handleActionAccepted = (instanceId: number, action: InstancePowerAction) => {
    setPendingActions((prev) => ({ ...prev, [instanceId]: true }));

    // Simulamos que el backend procesa la acción y cambia el estado después de 3 segundos
    setTimeout(() => {
      setInstances((prev) =>
        prev.map((inst) => {
          if (inst.id === instanceId) {
            const newStatus = action === 'start' ? 'running' : 'stopped';
            return { ...inst, status: newStatus };
          }
          return inst;
        })
      );
      setPendingActions((prev) => ({ ...prev, [instanceId]: false }));
    }, 3000);
  };

  // Simula la eliminación de una instancia
  const handleDeleteAccepted = (instanceId: number) => {
    setInstances((prev) => prev.filter((inst) => inst.id !== instanceId));
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Probador de Instancias (Mock Local)</h1>
        <p className="text-sm text-slate-500">
          Usa este componente para probar los modales corregidos, permisos y estados de transición sin backend.
        </p>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <th className="p-3">ID</th>
              <th className="p-3">Nombre</th>
              <th className="p-3">Tipo / Nodo</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Nivel de Acceso</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {instances.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-slate-400">
                  No hay instancias disponibles. Recargá la página para reiniciar el mock.
                </td>
              </tr>
            ) : (
              instances.map((instance) => {
                const isPowerActionPending = !!pendingActions[instance.id];

                return (
                  <tr key={instance.id} className="hover:bg-slate-50/50">
                    <td className="p-3 text-slate-500 font-mono text-xs">{instance.id}</td>
                    <td className="p-3 font-medium text-slate-800">{instance.name}</td>
                    <td className="p-3 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{instance.type}</span> ({instance.node})
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          instance.status === 'running'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {instance.status}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-slate-500">{instance.nivelAcceso}</td>
                    <td className="p-3 text-right">
                      <InstanceAction
                        instance={instance}
                        isPowerActionPending={isPowerActionPending}
                        onActionAccepted={(action) => handleActionAccepted(instance.id, action)}
                        onDeleteAccepted={() => handleDeleteAccepted(instance.id)}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}