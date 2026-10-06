import { useState } from 'react';
import { CirclePlay, Square } from 'lucide-react';
import { ConfirmUserAction } from '@/components/common/ConfirmUserAction';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { useAuth } from '@/context/AuthContext';
import { ApiRequestError } from '@/services/apiClient';
import { requestInstancePowerAction } from '../services/instanceService';
import type { InventoryInstance, InstancePowerAction } from '../types/instance';

interface InstanceActionProps {
  instance: InventoryInstance;
  onActionAccepted: () => void;
}

export default function InstanceAction({ instance, onActionAccepted }: InstanceActionProps) {
  const { canOperateInstance } = useAuth();
  const [pendingAction, setPendingAction] = useState<InstancePowerAction | null>(null);
  const canOperate = canOperateInstance(instance.id) && instance.nivelAcceso !== 'READ_ONLY';
  const hasActiveTask = instance.activeTask?.status === 'RUNNING';
  const action = instance.status === 'running' ? 'stop' : instance.status === 'stopped' ? 'start' : null;

  async function confirmPowerAction() {
    // Volver a validar si los permisos cambiaron mientras el modal estaba abierto.
    if (!pendingAction || !canOperateInstance(instance.id) || instance.nivelAcceso === 'READ_ONLY') {
      throw new ApiRequestError('No tenés permiso para operar esta instancia.');
    }
    if (hasActiveTask) throw new ApiRequestError('La instancia ya tiene una tarea en curso.');
    await requestInstancePowerAction(instance.id, pendingAction);
    toast.add({
      title: 'Orden enviada',
      description: `Se solicitó ${pendingAction === 'start' ? 'el encendido' : 'el apagado'} de ${instance.name}.`,
      type: 'success',
    });
  }

  return (
    <>
      {canOperate && action && (
        <Button type="button" variant="outline" size="icon"
          aria-label={`${action === 'start' ? 'Encender' : 'Apagar'} ${instance.name}`}
          disabled={hasActiveTask}
          onClick={() => setPendingAction(action)}>
          {action === 'start' ? <CirclePlay className="size-4!" /> : <Square className="size-4!" />}
        </Button>
      )}
      {!canOperate && <span aria-label="Sin permiso operativo">—</span>}
      {pendingAction && canOperate && (
        <ConfirmUserAction
          variant={pendingAction === 'stop' ? 'destructive' : 'confirmation'}
          title={pendingAction === 'start' ? 'Encender instancia' : 'Apagar instancia'}
          description={`¿Querés ${pendingAction === 'start' ? 'encender' : 'apagar'} ${instance.name} (${instance.id})?${pendingAction === 'stop' ? ' El apagado es forzado y puede interrumpir procesos activos.' : ''}`}
          onConfirm={confirmPowerAction}
          onCancel={() => setPendingAction(null)}
          onCompleted={() => { setPendingAction(null); onActionAccepted(); }}
        />
      )}
    </>
  );
}
