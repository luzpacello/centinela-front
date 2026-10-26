import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { toast } from '@/components/ui/toast';
import { useEventsContext } from '@/context/EventsContext';
import type { InstanceRef, InventoryInstance } from '../types/instance';

export interface PendingInstanceCreation {
    instance: InventoryInstance;
    tareaId: string;
    status: 'creating' | 'stopped';
}

interface PendingInstanceCreationsContextValue {
    creations: PendingInstanceCreation[];
    addCreation: (vmid: InstanceRef, tareaId: string, name: string, type: 'vm' | 'lxc') => void;
    removeCreation: (vmid: InstanceRef) => void;
}

const PendingInstanceCreationsContext = createContext<PendingInstanceCreationsContextValue | null>(null);

export function PendingInstanceCreationsProvider({ children }: { children: ReactNode }) {
    const [creations, setCreations] = useState<PendingInstanceCreation[]>([]);
    const { ultimoMensaje } = useEventsContext();
    const handledEvents = useRef(new Set<string>());

    const addCreation = useCallback((vmid: InstanceRef, tareaId: string, name: string, type: 'vm' | 'lxc') => {
        const instance: InventoryInstance = {
            id: vmid,
            name,
            type: type === 'vm' ? 'VM' : 'LXC',
            node: '—',
            status: 'creating',
            activeTask: { tareaId, action: 'CREATE', status: 'RUNNING' },
        };
        setCreations((current) => [
            ...current.filter((creation) => String(creation.instance.id) !== String(vmid)),
            { instance, tareaId, status: 'creating' },
        ]);
    }, []);

    const removeCreation = useCallback((vmid: InstanceRef) => {
        setCreations((current) => current.filter((creation) => String(creation.instance.id) !== String(vmid)));
    }, []);

    useEffect(() => {
        const message = ultimoMensaje;
        if (!message || message.tipo !== 'TASK_FINISHED' || handledEvents.current.has(message.id)) return;

        const details = message.detalles;
        const taskId = typeof details?.tareaId === 'string' ? details.tareaId : null;
        const resourceId = message.recursoId;
        const creation = creations.find((item) =>
            item.status === 'creating'
            && (item.tareaId === taskId || String(item.instance.id) === resourceId));
        if (!creation) return;

        handledEvents.current.add(message.id);
        const state = typeof details?.estado === 'string' ? details.estado.toUpperCase() : '';
        if (state === 'COMPLETED') {
            setCreations((current) => current.map((item) => String(item.instance.id) === String(creation.instance.id)
                ? {
                    ...item,
                    status: 'stopped',
                    instance: { ...item.instance, status: 'stopped', activeTask: null },
                }
                : item));
            toast.add({
                title: 'Instancia aprovisionada',
                description: `Instancia ${creation.instance.name} (${creation.instance.id}) aprovisionada correctamente`,
                type: 'success',
            });
            return;
        }

        if (state === 'FAILED') {
            const reason = typeof details?.motivo === 'string' ? details.motivo : null;
            const error = typeof details?.error === 'string' ? details.error : null;
            const exitStatus = typeof details?.exitstatus === 'string' ? details.exitstatus : null;
            const description = reason === 'TIMEOUT'
                ? 'La tarea de aprovisionamiento excedió el tiempo límite.'
                : reason === 'PROXMOX_ERROR'
                    ? error || exitStatus || 'Proxmox no pudo completar el aprovisionamiento.'
                    : error || exitStatus || 'La tarea de aprovisionamiento falló.';
            setCreations((current) => current.filter((item) => String(item.instance.id) !== String(creation.instance.id)));
            toast.add({
                title: `No se pudo aprovisionar ${creation.instance.name} (${creation.instance.id})`,
                description,
                type: 'error',
                priority: 'high',
            });
        }
    }, [ultimoMensaje, creations]);

    return (
        <PendingInstanceCreationsContext.Provider value={{ creations, addCreation, removeCreation }}>
            {children}
        </PendingInstanceCreationsContext.Provider>
    );
}

export function usePendingInstanceCreations(): PendingInstanceCreationsContextValue {
    const context = useContext(PendingInstanceCreationsContext);
    if (!context) {
        throw new Error('usePendingInstanceCreations debe utilizarse dentro de PendingInstanceCreationsProvider');
    }
    return context;
}
