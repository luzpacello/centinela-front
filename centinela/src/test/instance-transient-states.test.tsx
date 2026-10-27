import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    canOperateInstance: () => true,
    isAdmin: () => true,
  }),
}));

import InstanceAction from '@/components/features/instances/components/InstanceAction';
import { InstanceStatusBadge } from '@/components/features/instances/components/InstanceBadges';
import SnapshotsTabContent from '@/components/features/instances/components/detail/SnapshotsTabContent';

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

    expect(screen.getByRole('status')).toHaveTextContent('Operación en curso: SNAPSHOT_CREATE');
    expect(screen.getByRole('button', { name: /apagar/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /reiniciar/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /eliminar/i })).toBeDisabled();
  });

  it('renderiza el estado vacío de la pestaña Snapshots', () => {
    render(<SnapshotsTabContent />);
    expect(screen.getByRole('heading', { name: 'Snapshots' })).toBeInTheDocument();
    expect(screen.getByText('Todavía no hay snapshots para mostrar.')).toBeInTheDocument();
  });
});
