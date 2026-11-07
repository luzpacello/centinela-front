import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAlerts } from '@/context/AlertsContext';
import type { NotificationAlert } from '@/context/AlertsContext';

function formatIncidentTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'hora no disponible';
  return new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

export default function DashboardAlertBanner() {
  const { activeHostCriticalAlerts } = useAlerts();
  const [dismissedOccurrences, setDismissedOccurrences] = useState<string[]>([]);
  const visibleAlerts = activeHostCriticalAlerts.filter(
    (alert) => !dismissedOccurrences.includes(`${alert.alertId}:${alert.disparadaEn}`),
  );

  if (visibleAlerts.length === 0) return null;

  const dismissVisibleAlerts = () => {
    setDismissedOccurrences((current) => [
      ...new Set([...current, ...visibleAlerts.map((alert) => `${alert.alertId}:${alert.disparadaEn}`)]),
    ]);
  };

  return (
    <section
      role="alert"
      aria-label="Alerta crítica de saturación del host"
      className="flex flex-col gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-red-950 shadow-sm sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="font-semibold">Saturación crítica del host</h2>
          <ul className="mt-1 space-y-1 text-sm text-red-900">
            {visibleAlerts.map((alert) => (
              <li key={alert.alertId}>
                <span className="font-medium">{formatMetric(alert.metrica)}:</span> {alert.mensaje}
                <span className="ml-1 text-red-800/80">({formatIncidentTime(alert.disparadaEn)})</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={dismissVisibleAlerts}
        aria-label="Descartar alertas críticas del host"
        className="shrink-0 self-end text-red-800 hover:bg-red-100 hover:text-red-950 sm:self-start"
      >
        Descartar <X className="size-4" aria-hidden="true" />
      </Button>
    </section>
  );
}

function formatMetric(value: NotificationAlert['metrica']): string {
  return value.toLocaleUpperCase('es');
}
