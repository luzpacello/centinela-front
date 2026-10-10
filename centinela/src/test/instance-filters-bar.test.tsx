import '@testing-library/jest-dom/vitest';
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import InstanceFiltersBar from '@/components/features/instances/components/InstanceFiltersBar';

type FiltersBarProps = ComponentProps<typeof InstanceFiltersBar>;

function renderBar(overrides: Partial<FiltersBarProps> = {}) {
  const props: FiltersBarProps = {
    search: '',
    onSearchChange: vi.fn(),
    statusFilter: 'all',
    onStatusFilterChange: vi.fn(),
    typeFilter: 'all',
    onTypeFilterChange: vi.fn(),
    totalCount: 10,
    runningCount: 6,
    stoppedCount: 4,
    ...overrides,
  };

  render(<InstanceFiltersBar {...props} />);
  return props;
}

describe('InstanceFiltersBar', () => {
  it('renderiza los filtros de estado con sus contadores', () => {
    renderBar();

    expect(screen.getByText('Instancias totales')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('En ejecución')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('Detenidas')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('permite buscar instancias y emite onSearchChange', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();

    renderBar({ onSearchChange });
    await user.type(screen.getByRole('textbox', { name: 'Buscar por ID o nombre' }), 'test');

    expect(onSearchChange).toHaveBeenCalled();
  });

  it('permite cambiar el filtro de estado a en ejecución', async () => {
    const user = userEvent.setup();
    const onStatusFilterChange = vi.fn();

    renderBar({ onStatusFilterChange });

    await user.click(screen.getByRole('tab', { name: /en ejecución/i }));

    expect(onStatusFilterChange).toHaveBeenCalledWith('running');
  });

  it('permite volver a mostrar todos los tipos de instancia', async () => {
    const user = userEvent.setup();
    const onTypeFilterChange = vi.fn();

    renderBar({ typeFilter: 'VM', onTypeFilterChange });

    await user.click(screen.getByRole('button', { name: 'Filtrar por tipo de instancia' }));
    await user.click(await screen.findByRole('menuitemradio', { name: /Ver todas las instancias/ }));

    expect(onTypeFilterChange).toHaveBeenCalledWith('all');
  });
});
