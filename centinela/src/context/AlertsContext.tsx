import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { toast } from '@/components/ui/toast';
import { useOptionalEventSubscription } from '@/context/EventsContext';
import type { CentinelaEventsMessage } from '@/services/eventsClient';
import type { RecursoTipo, RealtimeSeverity } from '@/types/notifications';

const ALERT_HISTORY_STORAGE_KEY = 'centinela.alert-history';
const MAX_ALERT_HISTORY = 50;

export type AlertStatus = 'ACTIVA' | 'RESUELTA';

export interface NotificationAlert {
  alertId: string;
  recursoTipo: RecursoTipo | null;
  recursoId: string | null;
  metrica: string;
  severidad: RealtimeSeverity;
  mensaje: string;
  disparadaEn: string;
  resueltaEn: string | null;
  estado: AlertStatus;
  leida: boolean;
}

interface AlertsContextValue {
  alerts: NotificationAlert[];
  activeAlerts: NotificationAlert[];
  activeUnreadCount: number;
  activeHostCriticalAlerts: NotificationAlert[];
  markAllAsRead: () => void;
  clearHistory: () => void;
}

const EMPTY_ALERTS: NotificationAlert[] = [];
const EMPTY_ALERTS_CONTEXT: AlertsContextValue = {
  alerts: EMPTY_ALERTS,
  activeAlerts: EMPTY_ALERTS,
  activeUnreadCount: 0,
  activeHostCriticalAlerts: EMPTY_ALERTS,
  markAllAsRead: () => {},
  clearHistory: () => {},
};

const AlertsContext = createContext<AlertsContextValue>(EMPTY_ALERTS_CONTEXT);

function readAlertHistory(): NotificationAlert[] {
  try {
    const stored = window.localStorage.getItem(ALERT_HISTORY_STORAGE_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isResolvedAlert).slice(0, MAX_ALERT_HISTORY);
  } catch {
    return [];
  }
}

function isResolvedAlert(value: unknown): value is NotificationAlert {
  if (!value || typeof value !== 'object') return false;
  const alert = value as Partial<NotificationAlert>;
  return alert.estado === 'RESUELTA'
    && typeof alert.alertId === 'string'
    && (alert.recursoTipo === null || alert.recursoTipo === 'VM' || alert.recursoTipo === 'LXC' || alert.recursoTipo === 'HOST')
    && (alert.recursoId === null || typeof alert.recursoId === 'string')
    && typeof alert.metrica === 'string'
    && (alert.severidad === 'INFO' || alert.severidad === 'WARNING' || alert.severidad === 'CRITICAL')
    && typeof alert.mensaje === 'string'
    && typeof alert.disparadaEn === 'string'
    && (alert.resueltaEn === null || typeof alert.resueltaEn === 'string')
    && typeof alert.leida === 'boolean';
}

function compareNewest(left: NotificationAlert, right: NotificationAlert): number {
  return Date.parse(right.disparadaEn) - Date.parse(left.disparadaEn);
}

function capResolvedHistory(alerts: NotificationAlert[]): NotificationAlert[] {
  let retainedResolved = 0;
  return alerts.filter((alert) => alert.estado === 'ACTIVA' || retainedResolved++ < MAX_ALERT_HISTORY);
}

function persistAlertHistory(alerts: NotificationAlert[]): void {
  try {
    window.localStorage.setItem(
      ALERT_HISTORY_STORAGE_KEY,
      JSON.stringify(alerts.filter((alert) => alert.estado === 'RESUELTA').slice(0, MAX_ALERT_HISTORY)),
    );
  } catch {
    // Storage puede estar deshabilitado; las alertas siguen disponibles en memoria.
  }
}

function detailString(event: CentinelaEventsMessage, key: string): string | null {
  const value = event.detalles?.[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

function alertIdentity(event: CentinelaEventsMessage): string {
  return detailString(event, 'alertId') ?? event.id;
}

function alertMetric(event: CentinelaEventsMessage): string {
  return detailString(event, 'metrica') ?? detailString(event, 'metric') ?? 'Saturación';
}

function sameResourceAndMetric(alert: NotificationAlert, event: CentinelaEventsMessage): boolean {
  return alert.estado === 'ACTIVA'
    && alert.recursoTipo === (event.recursoTipo ?? null)
    && alert.recursoId === event.recursoId
    && alert.metrica === alertMetric(event);
}

function addTriggeredAlert(
  alerts: NotificationAlert[],
  event: CentinelaEventsMessage,
): NotificationAlert[] {
  const alert: NotificationAlert = {
    alertId: alertIdentity(event),
    recursoTipo: event.recursoTipo ?? null,
    recursoId: event.recursoId,
    metrica: alertMetric(event),
    severidad: event.severidad,
    mensaje: event.mensaje?.trim() || 'Se detectó una alerta de saturación.',
    disparadaEn: event.fechaHora || new Date().toISOString(),
    resueltaEn: null,
    estado: 'ACTIVA',
    leida: false,
  };
  return capResolvedHistory([alert, ...alerts.filter((current) => !sameResourceAndMetric(current, event))]);
}

function resolveAlert(
  alerts: NotificationAlert[],
  event: CentinelaEventsMessage,
): NotificationAlert[] {
  const requestedAlertId = detailString(event, 'alertId');
  const index = requestedAlertId
    ? alerts.findIndex((alert) => alert.estado === 'ACTIVA' && alert.alertId === requestedAlertId)
    : -1;
  const fallbackIndex = alerts.findIndex((alert) => sameResourceAndMetric(alert, event));
  const resolvedIndex = index >= 0 ? index : fallbackIndex;
  if (resolvedIndex < 0) return alerts;

  const resolved = alerts.map((alert, alertIndex) => alertIndex === resolvedIndex
    ? { ...alert, estado: 'RESUELTA' as const, resueltaEn: event.fechaHora || new Date().toISOString() }
    : alert);
  return capResolvedHistory(resolved.sort(compareNewest));
}

export function AlertsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<NotificationAlert[]>(readAlertHistory);

  const handleTriggered = useCallback((event: CentinelaEventsMessage) => {
    setAlerts((current) => addTriggeredAlert(current, event));
    if (event.severidad === 'CRITICAL') {
      toast.add({
        title: 'Alerta crítica de saturación',
        description: event.mensaje || 'Se detectó una saturación crítica de recursos.',
        type: 'error',
        priority: 'high',
        timeout: 0,
      });
    }
  }, []);

  const handleResolved = useCallback((event: CentinelaEventsMessage) => {
    setAlerts((current) => resolveAlert(current, event));
  }, []);

  useOptionalEventSubscription({ tipo: 'ALERT_TRIGGERED' }, handleTriggered);
  useOptionalEventSubscription({ tipo: 'ALERT_RESOLVED' }, handleResolved);

  useEffect(() => {
    persistAlertHistory(alerts);
  }, [alerts]);

  const markAllAsRead = useCallback(() => {
    setAlerts((current) => current.map((alert) => ({ ...alert, leida: true })));
  }, []);

  const clearHistory = useCallback(() => {
    setAlerts((current) => current.filter((alert) => alert.estado === 'ACTIVA'));
  }, []);

  const value = useMemo<AlertsContextValue>(() => {
    const activeAlerts = alerts.filter((alert) => alert.estado === 'ACTIVA');
    return {
      alerts,
      activeAlerts,
      activeUnreadCount: activeAlerts.filter((alert) => !alert.leida).length,
      activeHostCriticalAlerts: activeAlerts.filter(
        (alert) => alert.recursoTipo === 'HOST' && alert.severidad === 'CRITICAL',
      ),
      markAllAsRead,
      clearHistory,
    };
  }, [alerts, clearHistory, markAllAsRead]);

  return <AlertsContext.Provider value={value}>{children}</AlertsContext.Provider>;
}

// Keep query components usable in isolated tests and previews without requiring
// the protected application providers.
// eslint-disable-next-line react-refresh/only-export-components
export function useAlerts(): AlertsContextValue {
  return useContext(AlertsContext);
}
