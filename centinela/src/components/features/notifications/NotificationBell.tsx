import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAlerts } from '@/context/AlertsContext';
import type { NotificationAlert } from '@/context/AlertsContext';

function relativeTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Hora no disponible';
  return formatDistanceToNow(date, { addSuffix: true, locale: es });
}

function severityClass(severity: NotificationAlert['severidad']): string {
  if (severity === 'CRITICAL') return 'bg-red-500';
  if (severity === 'WARNING') return 'bg-amber-500';
  return 'bg-blue-500';
}

function alertDestination(alert: NotificationAlert): string | null {
  if ((alert.recursoTipo !== 'VM' && alert.recursoTipo !== 'LXC') || !alert.recursoId?.trim()) return null;
  return `/instances/${encodeURIComponent(alert.recursoId)}`;
}

export default function NotificationBell() {
  const { alerts, activeUnreadCount, markAllAsRead, clearHistory } = useAlerts();
  const orderedAlerts = useMemo(
    () => [...alerts].sort((left, right) => Date.parse(right.disparadaEn) - Date.parse(left.disparadaEn)),
    [alerts],
  );
  const resolvedCount = alerts.filter((alert) => alert.estado === 'RESUELTA').length;

  return (
    <div className="fixed right-4 top-4 z-40 sm:right-6 sm:top-5">
      <Popover>
        <PopoverTrigger
          type="button"
          aria-label="Centro de notificaciones"
          aria-haspopup="dialog"
          className="relative flex size-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <Bell className={`size-5 ${activeUnreadCount > 0 ? 'animate-pulse text-red-600' : ''}`} aria-hidden="true" />
          {activeUnreadCount > 0 && (
            <Badge
              variant="destructive"
              aria-label={`${activeUnreadCount} ${activeUnreadCount === 1 ? 'alerta activa' : 'alertas activas'} sin leer`}
              className="absolute -right-2 -top-2 min-w-6 justify-center rounded-full border-2 border-white px-1.5 tabular-nums"
            >
              {activeUnreadCount}
            </Badge>
          )}
        </PopoverTrigger>
        <PopoverContent
          align="end"
          side="bottom"
          sideOffset={10}
          className="w-[min(22rem,calc(100vw-2rem))] gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <PopoverTitle className="text-sm font-semibold text-slate-900">Notificaciones</PopoverTitle>
              <p className="mt-0.5 text-xs text-slate-500">
                {activeUnreadCount === 0 ? 'Estás al día' : `${activeUnreadCount} alerta${activeUnreadCount === 1 ? '' : 's'} sin leer`}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={activeUnreadCount === 0}
              onClick={markAllAsRead}
              className="h-8 gap-1.5 px-2 text-xs text-slate-600"
            >
              <CheckCheck className="size-3.5" aria-hidden="true" />
              Marcar leídas
            </Button>
          </div>

          <div className="max-h-[min(60vh,26rem)] overflow-y-auto p-2">
            {orderedAlerts.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-slate-500">Todavía no hay alertas.</p>
            ) : (
              <ul className="space-y-1">
                {orderedAlerts.map((alert) => {
                  const destination = alertDestination(alert);
                  const content = (
                    <>
                      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${severityClass(alert.severidad)}`} aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium text-slate-800">{alert.metrica}</span>
                          <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${alert.estado === 'ACTIVA' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                            {alert.estado === 'ACTIVA' ? 'Activa' : 'Resuelta'}
                          </span>
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-slate-600">{alert.mensaje}</span>
                        <span className="mt-1 block text-[11px] text-slate-400">{relativeTime(alert.disparadaEn)}</span>
                      </span>
                    </>
                  );
                  return (
                    <li key={`${alert.alertId}-${alert.disparadaEn}`}>
                      {destination ? (
                        <Link
                          to={destination}
                          className="flex gap-3 rounded-xl px-3 py-3 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                        >
                          {content}
                        </Link>
                      ) : (
                        <div className="flex gap-3 rounded-xl px-3 py-3">{content}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5">
            <span className="text-xs text-slate-500">{resolvedCount} resuelta{resolvedCount === 1 ? '' : 's'}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={resolvedCount === 0}
              onClick={clearHistory}
              className="h-8 gap-1.5 px-2 text-xs text-slate-500"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Limpiar historial
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
