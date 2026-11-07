import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardAlertBanner from '@/components/features/notifications/DashboardAlertBanner';
import NotificationBell from '@/components/features/notifications/NotificationBell';
import type { NotificationAlert } from '@/context/AlertsContext';

const alertState = vi.hoisted(() => ({
  useAlerts: vi.fn(),
}));

vi.mock('@/context/AlertsContext', () => ({
  useAlerts: alertState.useAlerts,
}));

const hostAlert: NotificationAlert = {
  alertId: 'host-cpu-1',
  recursoTipo: 'HOST',
  recursoId: null,
  metrica: 'CPU',
  severidad: 'CRITICAL',
  mensaje: 'El procesador alcanzó el 98%.',
  disparadaEn: '2026-11-07T12:00:00.000Z',
  resueltaEn: null,
  estado: 'ACTIVA',
  leida: false,
};

const defaults = {
  alerts: [hostAlert],
  activeAlerts: [hostAlert],
  activeUnreadCount: 1,
  activeHostCriticalAlerts: [hostAlert],
  markAllAsRead: vi.fn(),
  clearHistory: vi.fn(),
};

describe('componentes de notificaciones', () => {
  beforeEach(() => {
    alertState.useAlerts.mockReturnValue(defaults);
  });

  it('muestra el banner para alertas críticas activas del host con semántica de alerta', () => {
    render(<DashboardAlertBanner />);
    expect(screen.getByRole('alert', { name: 'Alerta crítica de saturación del host' })).toBeInTheDocument();
    expect(screen.getByText('Saturación crítica del host')).toBeInTheDocument();
    expect(screen.getByText(/El procesador alcanzó el 98%/)).toBeInTheDocument();
  });

  it('oculta el banner cuando no hay alertas críticas de host activas', () => {
    alertState.useAlerts.mockReturnValue({ ...defaults, activeHostCriticalAlerts: [] });
    const { container } = render(<DashboardAlertBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('expone la campana con nombre accesible y contador de alertas activas no leídas', () => {
    render(<NotificationBell />);
    expect(screen.getByRole('button', { name: 'Centro de notificaciones' })).toBeInTheDocument();
    expect(screen.getByLabelText('1 alerta activa sin leer')).toHaveTextContent('1');
  });

  it('enlaza las alertas asociadas a una instancia a su detalle', async () => {
    const vmAlert = { ...hostAlert, recursoTipo: 'VM' as const, recursoId: 'vm-12' };
    alertState.useAlerts.mockReturnValue({
      ...defaults,
      alerts: [vmAlert],
      activeAlerts: [vmAlert],
    });

    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Centro de notificaciones' }));
    expect(await screen.findByRole('link', { name: /El procesador alcanzó el 98%/ }))
      .toHaveAttribute('href', '/instances/vm-12');
  });
});
