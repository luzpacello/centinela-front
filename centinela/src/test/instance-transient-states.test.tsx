import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    canOperateInstance: () => true,
    isAdmin: () => true,
  }),
}));

// La pestaña de Snapshots lee el canal de eventos para refrescar su estado; en
// esta prueba solo se verifica el render del estado vacío, así que se reemplaza
// el canal compartido por un contexto sin mensajes ni conexión abierta.
vi.mock('@/context/EventsContext', () => ({
  useEventsContext: () => ({ ultimoMensaje: null }),
  useEventSubscription: () => {},
}));

import InstanceAction from '@/components/features/instances/components/InstanceAction';
import { InstanceStatusBadge } from '@/components/features/instances/components/InstanceBadges';
import { SnapshotsTabContent } from '@/components/features/instances/components/detail/SnapshotsTabContent';
import { snapshotService } from '@/components/features/instances/services/snapshotService';

const instance = {
  id: 110,
  name: 'api-produccion',
  type: 'VM' as const,
  node: 'pve-01',
  status: 'running',
  activeTask: { tareaId: 'snapshot-1', action: 'SNAPSHOT_CREATE', status: 'RUNNING' },
};

describe('Estados transitorios de instancia', () => {
  it('muestra badges accesibles para creación y restauración de snapshots', () => {
    const { rerender } = render(<InstanceStatusBadge status="SNAPSHOTTING" />);
    expect(screen.getByText('Creando Snapshot...')).toBeInTheDocument();

    rerender(<InstanceStatusBadge status="ROLLING_BACK" />);
    expect(screen.getByText('Restaurando...')).toBeInTheDocument();
  });

  it('bloquea las acciones rápidas y explica la tarea activa en el detalle', () => {
    render(
      <InstanceAction
        variant="header"
        instance={instance}
        transition={{ isTransitioning: true, tareaId: 'snapshot-1', action: 'SNAPSHOT_CREATE' }}
        isPowerActionPending={false}
        onActionAccepted={vi.fn()}
        onDeleteAccepted={vi.fn()}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Operación en curso: creación de snapshot');
    expect(screen.getByRole('button', { name: /apagar/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /reiniciar/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /eliminar/i })).toBeDisabled();
  });

  it('renderiza el estado vacío de la pestaña Snapshots', async () => {
    vi.spyOn(snapshotService, 'getSnapshots').mockResolvedValue([]);
    render(<SnapshotsTabContent vmid={instance.id} />);
    expect(await screen.findByText('No hay puntos de restauración registrados para esta instancia')).toBeInTheDocument();
    expect(screen.getByText(/Puntos de Restauración \(Snapshots\)/)).toBeInTheDocument();
  });
});
