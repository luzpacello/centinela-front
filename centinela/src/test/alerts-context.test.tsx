import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from '@/components/ui/toast';
import { AlertsProvider, useAlerts } from '@/context/AlertsContext';
import type { CentinelaEventsMessage } from '@/services/eventsClient';

const eventSubscriptions = vi.hoisted(() => ({
  handlers: new Map<string, (event: CentinelaEventsMessage) => void>(),
}));

vi.mock('@/context/EventsContext', () => ({
  useOptionalEventSubscription: (
    filter: { tipo?: string },
    callback: (event: CentinelaEventsMessage) => void,
  ) => {
    if (filter.tipo) eventSubscriptions.handlers.set(filter.tipo, callback);
  },
}));

function Consumer() {
  const { activeAlerts, activeUnreadCount, activeHostCriticalAlerts, markAllAsRead, clearHistory } = useAlerts();
  return (
    <div>
      <output data-testid="active-count">{activeAlerts.length}</output>
      <output data-testid="unread-count">{activeUnreadCount}</output>
      <output data-testid="host-critical-count">{activeHostCriticalAlerts.length}</output>
      <output data-testid="alert-list">{JSON.stringify(useAlerts().alerts)}</output>
      <button type="button" onClick={markAllAsRead}>Leer todas</button>
      <button type="button" onClick={clearHistory}>Limpiar historial</button>
    </div>
  );
}

function event(overrides: Partial<CentinelaEventsMessage>): CentinelaEventsMessage {
  return {
    id: 'evt-default',
    tipo: 'ALERT_TRIGGERED',
    severidad: 'CRITICAL',
    recursoId: null,
    recursoTipo: 'HOST',
    mensaje: 'Uso crítico de CPU',
    fechaHora: '2026-11-07T12:00:00.000Z',
    detalles: { alertId: 'alert-default', metrica: 'CPU' },
    ...overrides,
  };
}

function emit(type: string, value: CentinelaEventsMessage) {
  const handler = eventSubscriptions.handlers.get(type);
  if (!handler) throw new Error(`Missing subscription for ${type}`);
  act(() => handler(value));
}

describe('AlertsProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    eventSubscriptions.handlers.clear();
    vi.spyOn(toast, 'add');
  });

  it('mantiene activas las métricas del host por separado y conserva las resueltas en historial', () => {
    render(
      <AlertsProvider>
        <Consumer />
      </AlertsProvider>,
    );

    emit('ALERT_TRIGGERED', event({ id: 'trigger-cpu', detalles: { alertId: 'cpu-1', metrica: 'CPU' } }));
    emit('ALERT_TRIGGERED', event({ id: 'trigger-ram', detalles: { alertId: 'ram-1', metrica: 'RAM' }, mensaje: 'Uso crítico de RAM' }));
    expect(screen.getByTestId('active-count')).toHaveTextContent('2');
    expect(screen.getByTestId('host-critical-count')).toHaveTextContent('2');
    expect(screen.getByTestId('unread-count')).toHaveTextContent('2');

    emit('ALERT_RESOLVED', event({
      id: 'resolve-cpu',
      tipo: 'ALERT_RESOLVED',
      detalles: { alertId: 'cpu-1', metrica: 'CPU' },
    }));
    expect(screen.getByTestId('active-count')).toHaveTextContent('1');
    expect(screen.getByTestId('host-critical-count')).toHaveTextContent('1');
    expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
    expect(JSON.parse(screen.getByTestId('alert-list').textContent ?? '[]')).toEqual(
      expect.arrayContaining([expect.objectContaining({ alertId: 'cpu-1', estado: 'RESUELTA' })]),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Leer todas' }));
    expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar historial' }));
    expect(screen.getByTestId('active-count')).toHaveTextContent('1');
    expect(JSON.parse(screen.getByTestId('alert-list').textContent ?? '[]')).toHaveLength(1);
    expect(window.localStorage.getItem('centinela.alert-history')).toBe('[]');
  });

  it('ignora resoluciones huérfanas y reemplaza la alerta activa de igual recurso y métrica', () => {
    render(
      <AlertsProvider>
        <Consumer />
      </AlertsProvider>,
    );

    emit('ALERT_RESOLVED', event({
      id: 'orphan',
      tipo: 'ALERT_RESOLVED',
      detalles: { alertId: 'not-seen', metrica: 'CPU' },
    }));
    expect(screen.getByTestId('active-count')).toHaveTextContent('0');

    emit('ALERT_TRIGGERED', event({
      id: 'first',
      fechaHora: '2026-11-07T12:00:00.000Z',
      detalles: { alertId: 'first-id', metrica: 'CPU' },
    }));
    emit('ALERT_TRIGGERED', event({
      id: 'second',
      fechaHora: '2026-11-07T12:01:00.000Z',
      mensaje: 'CPU sigue saturada',
      detalles: { alertId: 'second-id', metrica: 'CPU' },
    }));

    expect(screen.getByTestId('active-count')).toHaveTextContent('1');
    expect(screen.getByTestId('alert-list')).toHaveTextContent('second-id');
    expect(screen.getByTestId('alert-list')).not.toHaveTextContent('first-id');
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ timeout: 0, priority: 'high' }));
  });
});
