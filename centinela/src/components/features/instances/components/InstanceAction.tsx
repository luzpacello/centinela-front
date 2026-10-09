import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Menu } from '@base-ui/react/menu';
import { CirclePlay, Eye, Loader2, MoreVertical, Square, RotateCcw, Trash } from 'lucide-react';
import { ConfirmUserAction } from '@/components/common/ConfirmUserAction';
import PermissionGate from '@/context/PermissionGate';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { useAuth } from '@/context/AuthContext';
import { ApiRequestError } from '@/services/apiClient';
import { requestInstancePowerAction, deleteInstance } from '../services/instanceService';
import type { InventoryInstance, InstancePowerAction, InstanceTransition } from '../types/instance';
import { Modal, ModalDescription, ModalFooter, ModalHeader, ModalIcon, ModalTitle } from '@/components/ui/modals';
import { Button } from '@/components/ui/button'; 
import { FieldError } from '@/components/ui/field';

interface InstanceActionProps {
  instance: InventoryInstance;
  // Estado de transición resuelto por la página (null = sin transición). Si no
  // se pasa, se deriva del activeTask del inventario.
  transition?: InstanceTransition | null;
  isPowerActionPending: boolean;
  onActionAccepted: (action: InstancePowerAction) => void;
  onDeleteAccepted: () => void;
}

// Etiqueta del botón en progreso según la acción reportada por el backend
// (START, STOP, SHUTDOWN, REBOOT, DELETE).
function describeTransitionAction(action: string): string {
  switch (action.toUpperCase()) {
    case 'START':
      return 'Encendiendo…';
    case 'STOP':
    case 'SHUTDOWN':
      return 'Apagando…';
    case 'REBOOT':
      return 'Reiniciando…';
    case 'DELETE':
      return 'Eliminando…';
    default:
      return 'Operación en progreso…';
  }
}

const POWER_ACTION_CONFIG: Record<InstancePowerAction, {
    title: string;
    description: string;
    confirmLabel: string;
    variant: 'confirmation' | 'destructive';
  }> = {
    start: {
      title: 'Encender instancia',
      description: '¿Deseás encender esta instancia?',
      confirmLabel: 'Encender',
      variant: 'confirmation',
    },
    shutdown: {
      title: 'Apagar instancia',
      description: 'Se enviará una señal ACPI al sistema operativo invitado para solicitar un apagado seguro.',
      confirmLabel: 'Apagar',
      variant: 'confirmation',
    },
    reboot: {
      title: 'Reiniciar instancia',
      description: 'Se enviará una señal ACPI al sistema operativo invitado para solicitar un reinicio.',
      confirmLabel: 'Reiniciar',
      variant: 'confirmation',
    },
    stop: {
      title: 'Forzar apagado',
      description: 'Advertencia: Forzar el apagado equivale a desconectar la alimentación y puede perder los datos.',
      confirmLabel: 'Forzar apagado',
      variant: 'destructive',
    },
  };

export default function InstanceAction({ instance, transition: transitionProp, isPowerActionPending, onActionAccepted, onDeleteAccepted }: InstanceActionProps) {
  const { canOperateInstance, isAdmin } = useAuth();
  const [pendingAction, setPendingAction] = useState<InstancePowerAction | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteVerification, setDeleteVerification] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  //const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setIsDetailsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const canOperate = canOperateInstance(instance.id) && instance.nivelAcceso !== 'READ_ONLY';

  console.log('InstanceAction DEBUG', {
    name: instance.name,
    id: instance.id,
    status: instance.status,
    nivelAcceso: instance.nivelAcceso,
    canOperate,
    canOperateByFunction: canOperateInstance(instance.id),
  });

  const activeTask = instance.activeTask ?? null;
  const derivedTransition: InstanceTransition | null = activeTask?.status === 'RUNNING'
    ? { isTransitioning: true, tareaId: activeTask.tareaId, action: activeTask.action }
    : null;
  const transition = transitionProp === undefined ? derivedTransition : transitionProp;
  // La fila se bloquea tanto por una tarea RUNNING como por una acción de
  // energía aceptada que todavía no convergió en el inventario.
  const isTransitioning = transition?.isTransitioning === true || isPowerActionPending;

  const canConfirmDelete =
    deleteVerification === instance.name ||
    deleteVerification === String(instance.id);

  async function confirmPowerAction() {
    // Volver a validar si los permisos cambiaron mientras el modal estaba abierto.
    if (!pendingAction) return;
    if (!canOperateInstance(instance.id)  || instance.nivelAcceso === 'READ_ONLY') {
      throw new ApiRequestError('No tenés permiso para operar esta instancia.');
    }
    if (isTransitioning) throw new ApiRequestError('La instancia ya tiene una tarea en curso.');
    
    const requiresRunningState =
      pendingAction === 'shutdown' ||
      pendingAction === 'reboot' ||
      pendingAction === 'stop';

    if (pendingAction === 'start' && instance.status !== 'stopped'){
      throw new ApiRequestError('La instancia no está detenida. Revisá la acción antes de continuar.');
    }
    if (requiresRunningState && instance.status !== 'running') {
      throw new ApiRequestError('La instancia no está en ejecución. Revisá la acción antes de continuar.');
    }

      await requestInstancePowerAction(instance.id, pendingAction);
      onActionAccepted(pendingAction);
      toast.add({
        title: 'Orden enviada',
        description: `${POWER_ACTION_CONFIG[pendingAction].confirmLabel} solicitado para ${instance.name}.`,
        type: 'success',
      });   
  }

  // Fila en transición: se reemplaza la celda de acciones por el botón en
  // progreso deshabilitado, bloqueando todos los controles de la máquina.
  if (isTransitioning) {
    const actionLabel = transition ? describeTransitionAction(transition.action) : 'Operación en progreso…';
    return (
      <button type="button" disabled aria-busy="true" aria-label={`${actionLabel} ${instance.name}`}
        className="inline-flex cursor-not-allowed items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
        <Loader2 data-testid="instance-transition-spinner" className="size-3.5 animate-spin" aria-hidden="true" />
        {actionLabel}
      </button>
    );
  }

  async function confirmDelete() {
    if (!canConfirmDelete) {
      setDeleteError(
        'Ingresá exactamente el nombre de la instancia o su ID.',
      );
      return;
    }

    if (!isAdmin()) {
      setDeleteError(
        'No tenés permisos para eliminar esta instancia.',
      );
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteInstance(instance.id);

      toast.add({
        title: 'Eliminación solicitada',
        description: `Se solicitó la eliminación de ${instance.name}.`,
        type: 'success',
      });

      setIsDeleteOpen(false);
      setDeleteVerification('');
      onDeleteAccepted();
    } catch (error) {
      if (
        error instanceof ApiRequestError &&
        [401, 403].includes(error.status)
      ) {
        throw error;
      }

      setDeleteError(
        error instanceof Error
          ? error.message
          : 'No se pudo solicitar la eliminación.',
      );
    } finally {
      setIsDeleting(false);
    }
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
                {/* 
              {canOperate && <>
                <Menu.Item render={<button type="button" />} nativeButton
                  disabled={instance.status !== 'stopped'}
                  onClick={() => { setIsMenuOpen(false); setPendingAction('start'); }}
                  className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 data-highlighted:bg-slate-50 flex items-center gap-2 outline-none data-disabled:opacity-50 data-disabled:cursor-not-allowed">
                  <Badge variant="secondary" className="h-auto rounded-md px-2.5 py-1"><CirclePlay className="text-emerald-600" /> Encender</Badge>
                </Menu.Item>
                <Menu.Item render={<button type="button" />} nativeButton
                  disabled={instance.status !== 'running'}
                  onClick={() => { setIsMenuOpen(false); setPendingAction('stop'); }}
                  className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 data-highlighted:bg-slate-50 flex items-center gap-2 outline-none data-disabled:opacity-50 data-disabled:cursor-not-allowed">
                  <Badge variant="secondary" className="h-auto rounded-md px-2.5 py-1"><Square className="text-amber-600" /> Apagar</Badge>
                </Menu.Item>
              </>}
              <Menu.Item render={<button type="button" />} nativeButton
                onClick={() => { setIsMenuOpen(false); setIsDetailsOpen(true); }}
                className={`w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 data-highlighted:bg-slate-50 flex items-center gap-2 outline-none ${canOperate ? 'border-t border-slate-100' : ''}`}>
                <Badge variant="secondary" className="h-auto rounded-md px-2.5 py-1"><Eye className="text-blue-600" /> Ver instancia</Badge>
              </Menu.Item>*/}
              {canOperate && (
                <>
                  {instance.status === 'stopped' && (
                    <Menu.Item render={<button type="button" />} nativeButton
                      onClick={() => {
                        setIsMenuOpen(false);
                        setPendingAction('start');
                      }}
                      className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 data-highlighted:bg-slate-50 flex items-center gap-2 outline-none data-disabled:opacity-50 data-disabled:cursor-not-allowed">
                        <Badge variant="secondary" className="h-auto rounded-md px-2.5 py-1"><CirclePlay className="text-emerald-600" /> Encender</Badge>
                    </Menu.Item>
                  )}

                  {instance.status === 'running' && (
                    <>
                      <Menu.Item render={<button type="button" />} nativeButton
                        onClick={() => {
                          setIsMenuOpen(false);
                          setPendingAction('shutdown');
                        }}
                        className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 data-highlighted:bg-slate-50 flex items-center gap-2 outline-none data-disabled:opacity-50 data-disabled:cursor-not-allowed">
                          <Badge variant="secondary" className="h-auto rounded-md px-2.5 py-1"><Square className="text-amber-600" /> Apagar</Badge>
                      </Menu.Item>

                      <Menu.Item render={<button type="button" />} nativeButton
                        onClick={() => {
                          setIsMenuOpen(false);
                          setPendingAction('reboot');
                        }}
                        className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 data-highlighted:bg-slate-50 flex items-center gap-2 outline-none data-disabled:opacity-50 data-disabled:cursor-not-allowed">
                          <Badge variant="secondary" className="h-auto rounded-md px-2.5 py-1"><RotateCcw className="text-amber-600" /> Reiniciar</Badge>
                      </Menu.Item>

                      <Menu.Item render={<button type="button" />} nativeButton
                        onClick={() => {
                          setIsMenuOpen(false);
                          setPendingAction('stop');
                        }}
                        className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 data-highlighted:bg-slate-50 flex items-center gap-2 outline-none data-disabled:opacity-50 data-disabled:cursor-not-allowed">
                          <Badge variant="secondary" className="h-auto rounded-md px-2.5 py-1"><Square className="text-amber-600" /> Forzar apagado</Badge>
                      </Menu.Item>
                    </>
                  )}
                </>
              )}
              <Menu.Item render={<button type="button" />} nativeButton
                onClick={() => { setIsMenuOpen(false); setIsDetailsOpen(true); }}
                className={`w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 data-highlighted:bg-slate-50 flex items-center gap-2 outline-none ${canOperate ? 'border-t border-slate-100' : ''}`}>
                <Badge variant="secondary" className="h-auto rounded-md px-2.5 py-1"><Eye className="text-blue-600" /> Ver instancia</Badge>
              </Menu.Item>
              <PermissionGate requiredRole="ADMIN">
                <Menu.Item
                  onClick={() => {
                    setIsMenuOpen(false);
                    setDeleteVerification('');
                    setDeleteError(null);
                    setIsDeleteOpen(true);
                  }}
                  className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 data-highlighted:bg-slate-50 flex items-center gap-2 outline-none data-disabled:opacity-50 data-disabled:cursor-not-allowed">
                    <Badge variant="secondary" className="h-auto rounded-md px-2.5 py-1"><Trash className="text-amber-600" /> Eliminar</Badge>
                </Menu.Item>
              </PermissionGate>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      {pendingAction && canOperate && createPortal(
        <ConfirmUserAction
          variant={POWER_ACTION_CONFIG[pendingAction].variant}
          title={POWER_ACTION_CONFIG[pendingAction].title}
          description={`${POWER_ACTION_CONFIG[pendingAction].description} ${instance.name} (${instance.id}).`}
          onConfirm={confirmPowerAction}
          onCancel={() => setPendingAction(null)}
          onCompleted={() => setPendingAction(null)}
        />,
        document.body,
      )}
      {isDeleteOpen && createPortal(
        <dialog
          ref={(node) => {
            if (node && !node.open) {
              node.showModal();
            }
          }}
          onCancel={(event) => {
            event.preventDefault();
            if (!isDeleting) {
              setIsDeleteOpen(false);
              setDeleteVerification('');
              setDeleteError(null);
            }
          }}
          className="m-auto w-full max-w-[520px] border-0 bg-transparent p-0 outline-none"
        >
          <Modal variant="destructive" aria-busy={isDeleting}>
            <ModalHeader>
              <ModalIcon aria-hidden="true">
                <Trash />
              </ModalIcon>
              <ModalTitle>Eliminar instancia permanentemente</ModalTitle>
              <ModalDescription>
                Esta acción es irreversible. La instancia{' '} <strong>{instance.name}</strong> ({instance.id}) será eliminada permanentemente.
              </ModalDescription>
            </ModalHeader>
            <div className='space-y-2 px-6'>
              <label htmlFor={`delete-verificarion-${instance.id}`}
              className='text-sm font-medium'>
                Escribí exactamente el nombre de la instancia o su ID para confirmar.
              </label>
              <input id={`delete-verificarion-${instance.id}`}
              value={deleteVerification}
              onChange={(event) => {
                setDeleteVerification(event.target.value);
                setDeleteError(null);
              }}
              disabled={isDeleting}
              className='w-full rounded-md border px-3 py-2 text-sm'
              autoComplete='off'
              />
              {deleteError && (
                <FieldError role='alert'>{deleteError}</FieldError>
              )}
            </div>
            <ModalFooter className='py-[30px]'>
              <Button
                type="button"
                variant="outline"
                disabled={isDeleting}
                onClick={() => {
                  setIsDeleteOpen(false);
                  setDeleteVerification('');
                  setDeleteError(null);
                }}
              >
                Cancelar
              </Button>

              <Button
                type="button"
                variant="destructive"
                disabled={!canConfirmDelete || isDeleting}
                onClick={() => void confirmDelete()}
              >
                {isDeleting
                  ? 'Eliminando…'
                  : 'Eliminar permanentemente'}
              </Button>
            </ModalFooter>
          </Modal>
        </dialog>, document.body
      )}
    </>
  );
}
