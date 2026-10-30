/*import { Camera, Clock3 } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function SnapshotsTabContent() {
    return (
        <Card className="gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm ring-0">
            <div>
                <h2 className="text-lg font-semibold text-slate-900">Snapshots</h2>
                <p className="mt-1 text-sm text-slate-500">Puntos de restauración de la instancia.</p>
            </div>
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-5 text-center">
                <Camera className="size-8 text-slate-400" aria-hidden="true" />
                <p className="font-medium text-slate-700">Todavía no hay snapshots para mostrar.</p>
                <p className="text-sm text-slate-500">Cuando estén disponibles, vas a poder consultar aquí los puntos de restauración.</p>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock3 className="size-3.5" aria-hidden="true" />
                    La gestión de snapshots estará disponible próximamente.
                </span>
            </div>
        </Card>
    );
}
*/
import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { Camera, Clock, RefreshCw, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { useAuth } from '@/context/AuthContext';
import { useEventsContext } from '@/context/EventsContext';
import { snapshotService, type SnapshotItem, type CreateSnapshotResponse } from '../../services/snapshotService';
import { CreateSnapshotModal } from '../snapshots/CreateSnapshotModal';
import { RollbackSnapshotModal } from '../snapshots/RollbackSnapshotModal';
import { DeleteSnapshotModal } from '../snapshots/DeleteSnapshotModal';
import type { SnapshotAction } from '../snapshots/SnapshotActionModal';

interface SnapshotsTabContentProps {
  vmid: number | string;
  isBusy?: boolean;
  onSubmittingChange?: (submitting: boolean) => void;
  onOutcomeUncertain?: () => void;
  onActionAccepted?: (taskId: string, action: SnapshotAction, snapshotName: string) => void;
  refreshVersion?: number;
}

function formatSnapshotDate(rawTime?: number | string): string {
  if (!rawTime) return 'Fecha desconocida';

  let date: Date;
  if (typeof rawTime === 'number') {
    const timestamp = rawTime < 10_000_000_000 ? rawTime * 1000 : rawTime;
    date = new Date(timestamp);
  } else {
    date = new Date(rawTime);
  }

  if (isNaN(date.getTime())) return String(rawTime);

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(date);
}

export function SnapshotsTabContent({ vmid, isBusy = false, onSubmittingChange = () => {}, onOutcomeUncertain = () => {}, onActionAccepted = () => {}, refreshVersion = 0 }: SnapshotsTabContentProps) {
  const { canOperateInstance } = useAuth();
  const { ultimoMensaje } = useEventsContext();

  const [snapshots, setSnapshots] = useState<SnapshotItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<{ action: SnapshotAction; snapshotName: string } | null>(null);
  const latestRequest = useRef(0);

  const [pendingTareaId, setPendingTareaId] = useState<string | null>(null);

  const canOperate = canOperateInstance(vmid);

  const fetchList = useCallback(async () => {
    const requestId = ++latestRequest.current;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await snapshotService.getSnapshots(vmid);
      if (requestId === latestRequest.current) setSnapshots(data);
    } catch (err: unknown) {
      if (requestId === latestRequest.current) setErrorMessage(err instanceof Error ? err.message : 'Error al cargar el historial de snapshots.');
    } finally {
      if (requestId === latestRequest.current) setIsLoading(false);
    }
  }, [vmid]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) void fetchList(); });
    return () => { active = false; latestRequest.current += 1; };
  }, [fetchList, refreshVersion]);

  // Escuchar el evento TASK_FINISHED asíncrono proveniente de Centinela/Proxmox
  useEffect(() => {
    if (!ultimoMensaje || !pendingTareaId) return;

    if (
      ultimoMensaje.tipo === 'TASK_FINISHED' &&
      ultimoMensaje.detalles?.tareaId === pendingTareaId
    ) {
      let active = true;
      queueMicrotask(() => {
        if (!active) return;
        const estado = ultimoMensaje.detalles?.estado;
        if (estado === 'COMPLETED') {
          toast.add({
            title: 'Snapshot Creado',
            description: 'El punto de restauración se guardó exitosamente en Proxmox.',
            type: 'success',
          });
          void fetchList();
        } else if (estado === 'FAILED') {
          const errorDetail = (ultimoMensaje.detalles?.error as string) || 'No se pudo completar la instantánea en Proxmox.';
          toast.add({
            title: 'Fallo al crear snapshot',
            description: errorDetail,
            type: 'error',
          });
        } else return;
        setPendingTareaId(null);
      });
      return () => { active = false; };
    }
  }, [ultimoMensaje, pendingTareaId, fetchList]);

  const cleanSnapshots = useMemo(() => {
    return snapshots.filter((item) => item.name.toLowerCase() !== 'current');
  }, [snapshots]);

  const handleSnapshotCreated = (res: CreateSnapshotResponse) => {
    setIsModalOpen(false);

    toast.add({
      title: 'Creación iniciada',
      description: 'Creación de snapshot iniciada en segundo plano.',
      type: 'info',
    });

    if (res.tareaId) {
      setPendingTareaId(res.tareaId);
    }

    fetchList();
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Puntos de Restauración (Snapshots)
          </CardTitle>
          <CardDescription>
            Historial de instantáneas disponibles para revertir estados de la máquina.
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchList}
            disabled={isLoading}
            title="Refrescar lista"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            onClick={() => setIsModalOpen(true)}
            disabled={!canOperate || isBusy}
            title={!canOperate ? 'Requiere permisos de escritura (FULL_ACCESS)' : undefined}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Crear Snapshot
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {isLoading && snapshots.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Cargando puntos de restauración...
          </div>
        ) : errorMessage ? (
          <div className="flex flex-col items-center justify-center h-32 space-y-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-6 w-6" />
            <p className="text-sm font-medium">{errorMessage}</p>
            <Button variant="outline" size="sm" onClick={fetchList}>Reintentar</Button>
          </div>
        ) : cleanSnapshots.length === 0 ? (
          <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 text-center space-y-3">
            <div className="rounded-full bg-muted p-3">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                No hay puntos de restauración registrados para esta instancia
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                Generá una instantánea antes de realizar cambios de configuración o actualizar software riesgoso.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              disabled={!canOperate || isBusy}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Crear Snapshot Ahora
            </Button>
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cleanSnapshots.map((snap) => (
                  <TableRow key={snap.name}>
                    <TableCell className="font-mono text-sm font-bold text-foreground">
                      {snap.name}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatSnapshotDate(snap.snaptime ?? snap.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm text-foreground max-w-xs truncate">
                      {snap.description?.trim() || <span className="text-muted-foreground italic">Sin descripción</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Guardado
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button type="button" variant="outline" size="sm" disabled={!canOperate || isBusy} aria-label={`Revertir ${snap.name}`}
                        onClick={() => setSelectedAction({ action: 'rollback', snapshotName: snap.name })}>Revertir</Button>{' '}
                      <Button type="button" variant="outline" size="sm" disabled={!canOperate || isBusy} aria-label={`Eliminar ${snap.name}`}
                        onClick={() => setSelectedAction({ action: 'delete', snapshotName: snap.name })}>Eliminar</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <CreateSnapshotModal
        instanceRef={vmid}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSnapshotCreated={handleSnapshotCreated}
      />
      {selectedAction && (selectedAction.action === 'rollback'
        ? <RollbackSnapshotModal instanceRef={vmid} snapshotName={selectedAction.snapshotName} canOperate={canOperate && !isBusy}
            onClose={() => setSelectedAction(null)} onSubmittingChange={onSubmittingChange} onOutcomeUncertain={onOutcomeUncertain}
            onAccepted={(taskId, action, snapshotName) => { onActionAccepted(taskId, action, snapshotName); setSelectedAction(null); }} />
        : <DeleteSnapshotModal instanceRef={vmid} snapshotName={selectedAction.snapshotName} canOperate={canOperate && !isBusy}
            onClose={() => setSelectedAction(null)} onSubmittingChange={onSubmittingChange} onOutcomeUncertain={onOutcomeUncertain}
            onAccepted={(taskId, action, snapshotName) => { onActionAccepted(taskId, action, snapshotName); setSelectedAction(null); }} />)}
    </Card>
  );
}
