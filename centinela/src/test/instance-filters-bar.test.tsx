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
    vmCount: 6,
    lxcCount: 4,
    ...overrides,
  };

  render(<InstanceFiltersBar {...props} />);
  return props;
}

describe('InstanceFiltersBar', () => {
  it('renderiza los filtros de tipo con sus contadores', () => {
    renderBar();

    expect(screen.getByText('Instancias totales')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Maquina virtual (VM) 6' })).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Contenedor (LXC) 4' })).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('permite buscar instancias y emite onSearchChange', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();

    renderBar({ onSearchChange });
    await user.type(screen.getByRole('textbox', { name: 'Buscar por ID, nombre o IP' }), 'test');

    expect(onSearchChange).toHaveBeenCalled();
  });

  it('permite cambiar el filtro de estado a en ejecución', async () => {
    const user = userEvent.setup();
    const onStatusFilterChange = vi.fn();

    renderBar({ onStatusFilterChange });

    await user.click(screen.getByRole('button', { name: 'Filtros' }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Encendidas' }));

    expect(onStatusFilterChange).toHaveBeenCalledWith('running');
  });

  it('permite volver a mostrar todos los tipos de instancia', async () => {
    const user = userEvent.setup();
    const onTypeFilterChange = vi.fn();

    renderBar({ typeFilter: 'VM', onTypeFilterChange });

    await user.click(screen.getByRole('tab', { name: /instancias totales/i }));

    expect(onTypeFilterChange).toHaveBeenCalledWith('all');
  });

  it('permite filtrar por máquinas virtuales (VM) desde las pestañas', async () => {
    const user = userEvent.setup();
    const onTypeFilterChange = vi.fn();

    renderBar({ onTypeFilterChange });

    await user.click(screen.getByRole('tab', { name: /Maquina virtual \(VM\)/i }));

    expect(onTypeFilterChange).toHaveBeenCalledWith('VM');
  });
});
