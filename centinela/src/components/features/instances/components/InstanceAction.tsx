import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Menu } from '@base-ui/react/menu';
import { CirclePlay, Eye, MoreVertical, Square } from 'lucide-react';
import { ConfirmUserAction } from '@/components/common/ConfirmUserAction';
import { Badge } from '@/components/ui/badge';
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
  const [, setIsDetailsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const canOperate = canOperateInstance(instance.id) && instance.nivelAcceso !== 'READ_ONLY';
  const hasActiveTask = instance.activeTask?.status === 'RUNNING';

  async function confirmPowerAction() {
    // Volver a validar si los permisos cambiaron mientras el modal estaba abierto.
    if (!pendingAction || !canOperateInstance(instance.id) || instance.nivelAcceso === 'READ_ONLY') {
      throw new ApiRequestError('No tenés permiso para operar esta instancia.');
    }
    if (hasActiveTask) throw new ApiRequestError('La instancia ya tiene una tarea en curso.');
    if ((pendingAction === 'start' && instance.status !== 'stopped')
      || (pendingAction === 'stop' && instance.status !== 'running')) {
      throw new ApiRequestError('El estado de la instancia cambió. Revisá la acción antes de continuar.');
    }
    await requestInstancePowerAction(instance.id, pendingAction);
    toast.add({
      title: 'Orden enviada',
      description: `Se solicitó ${pendingAction === 'start' ? 'el encendido' : 'el apagado'} de ${instance.name}.`,
      type: 'success',
    });
  }

  return (
    <>
      <Menu.Root open={isMenuOpen} onOpenChange={setIsMenuOpen} modal={false}>
        <Menu.Trigger type="button" aria-label={`Acciones para ${instance.name}`}
          className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 transition-colors inline-flex items-center justify-center">
          <MoreVertical className="size-4" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner align="end" sideOffset={4} className="z-50">
            <Menu.Popup aria-label={`Acciones para ${instance.name}`} finalFocus={pendingAction ? false : undefined}
              className="w-52 bg-white rounded-lg shadow-lg border border-slate-200 py-1 text-left outline-none">
              {canOperate && <>
                <Menu.Item render={<button type="button" />} nativeButton
                  disabled={hasActiveTask || instance.status !== 'stopped'}
                  onClick={() => { setIsMenuOpen(false); setPendingAction('start'); }}
                  className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 data-highlighted:bg-slate-50 flex items-center gap-2 outline-none data-disabled:opacity-50 data-disabled:cursor-not-allowed">
                  <Badge variant="secondary" className="h-auto rounded-md px-2.5 py-1"><CirclePlay className="text-emerald-600" /> Encender</Badge>
                </Menu.Item>
                <Menu.Item render={<button type="button" />} nativeButton
                  disabled={hasActiveTask || instance.status !== 'running'}
                  onClick={() => { setIsMenuOpen(false); setPendingAction('stop'); }}
                  className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 data-highlighted:bg-slate-50 flex items-center gap-2 outline-none data-disabled:opacity-50 data-disabled:cursor-not-allowed">
                  <Badge variant="secondary" className="h-auto rounded-md px-2.5 py-1"><Square className="text-amber-600" /> Apagar</Badge>
                </Menu.Item>
              </>}
              <Menu.Item render={<button type="button" />} nativeButton
                onClick={() => { setIsMenuOpen(false); setIsDetailsOpen(true); }}
                className={`w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 data-highlighted:bg-slate-50 flex items-center gap-2 outline-none ${canOperate ? 'border-t border-slate-100' : ''}`}>
                <Badge variant="secondary" className="h-auto rounded-md px-2.5 py-1"><Eye className="text-blue-600" /> Ver instancia</Badge>
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      {pendingAction && canOperate && createPortal(
        <ConfirmUserAction
          variant={pendingAction === 'stop' ? 'destructive' : 'confirmation'}
          title={pendingAction === 'start' ? 'Encender instancia' : 'Apagar instancia'}
          description={`¿Querés ${pendingAction === 'start' ? 'encender' : 'apagar'} ${instance.name} (${instance.id})?${pendingAction === 'stop' ? ' El apagado es forzado y puede interrumpir procesos activos.' : ''}`}
          onConfirm={confirmPowerAction}
          onCancel={() => setPendingAction(null)}
          onCompleted={() => { setPendingAction(null); onActionAccepted(); }}
        />,
        document.body,
      )}
    </>
  );
}
