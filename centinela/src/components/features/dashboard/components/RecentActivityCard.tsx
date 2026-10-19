import { useEffect, useRef, useState, type ElementType } from 'react';
import { useEventSubscription } from '@/context/EventsContext';
import { useNavigate } from 'react-router';
import { ArrowRight, CirclePlay, LogIn, Plus, Settings, Square, Trash2, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getRecentActivity, type ActivityItem } from '../services/activityService';
import { detalleCorto } from '@/utils/auditDetalle';
import { formatRelativeTime } from '../utils/formatRelativeTime';

// Etiquetas legibles para los códigos de acción de la auditoría.
const ACTION_LABELS: Record<string, string> = {
    LOGIN: 'Inicio de sesión',
    LOGOUT: 'Cierre de sesión',
    INICIAR_VM: 'Instancia iniciada',
    DETENER_VM: 'Instancia detenida',
    APAGAR_VM: 'Instancia apagada',
    REINICIAR_VM: 'Instancia reiniciada',
    ELIMINAR_VM: 'Instancia eliminada',
    CREAR_VM: 'Nueva instancia creada',
    CREAR_INSTANCIA: 'Nueva instancia creada',
    CREAR_USUARIO: 'Usuario creado',
    EDITAR_USUARIO: 'Usuario actualizado',
    ELIMINAR_USUARIO: 'Usuario eliminado',
    CREAR_ROL: 'Rol creado',
    EDITAR_ROL: 'Rol actualizado',
    EXPORTAR_AUDITORIA: 'Auditoría exportada',
    VERIFICAR_2FA: 'Verificación 2FA',
    CAMBIAR_CONTRASENA: 'Contraseña actualizada',
};

function activityLabel(accion?: string | null): string {
    const code = (accion ?? '').trim().toUpperCase();
    if (!code) return 'Actividad';
    if (ACTION_LABELS[code]) return ACTION_LABELS[code];
    const prettified = code.toLowerCase().replaceAll('_', ' ');
    return prettified.charAt(0).toUpperCase() + prettified.slice(1);
}

function activityTheme(accion?: string | null): { icon: ElementType; className: string } {
    const code = (accion ?? '').toUpperCase();
    if (code.startsWith('INICIAR') || code.startsWith('REINICIAR')) {
        return { icon: CirclePlay, className: 'bg-emerald-50 text-emerald-700' };
    }
    if (code.startsWith('APAGAR') || code.startsWith('DETENER')) {
        return { icon: Square, className: 'bg-slate-100 text-slate-500' };
    }
    if (code.startsWith('ELIMINAR')) {
        return { icon: Trash2, className: 'bg-rose-50 text-rose-500' };
    }
    if (code.startsWith('CREAR')) {
        return { icon: Plus, className: 'bg-emerald-50 text-emerald-700' };
    }
    if (code.includes('USUARIO') || code.includes('ROL')) {
        return { icon: UserRound, className: 'bg-violet-50 text-violet-600' };
    }
    if (code.startsWith('LOGIN') || code.startsWith('LOGOUT')) {
        return { icon: LogIn, className: 'bg-slate-100 text-slate-500' };
    }
    return { icon: Settings, className: 'bg-slate-100 text-slate-500' };
}

function activitySubtitle(item: ActivityItem): string | null {
    if (item.instanciaNombre) return item.instanciaNombre;
    return detalleCorto(item.detalles);
}

// Panel "Actividad reciente" del Dashboard: los últimos movimientos reales de
// la auditoría (requiere rol ADMIN). Sin datos simulados: carga, error y vacío
// son reales.
export default function RecentActivityCard() {
    const navigate = useNavigate();
    const [items, setItems] = useState<ActivityItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [reloadCount, setReloadCount] = useState(0);
    const hasLoaded = useRef(false);

    useEffect(() => {
        const controller = new AbortController();

        // Solo la primera carga muestra skeletons: las revalidaciones que disparan
        // los eventos del canal son silenciosas, para no parpadear el panel.
        const load = async () => {
            if (!hasLoaded.current) setIsLoading(true);
            setErrorMessage(null);
            try {
                const page = await getRecentActivity(controller.signal);
                if (controller.signal.aborted) return;
                hasLoaded.current = true;
                setItems(page.items ?? []);
            } catch (error: unknown) {
                if (controller.signal.aborted) return;
                setErrorMessage(error instanceof Error ? error.message : 'No se pudo cargar la actividad reciente.');
            } finally {
                if (!controller.signal.aborted) setIsLoading(false);
            }
        };

        void load();
        return () => controller.abort();
    }, [reloadCount]);

    // Los movimientos nuevos llegan por el canal: al terminar una tarea o al
    // cambiar el estado de una instancia se relee la auditoría al instante, sin
    // esperar a que el operador recargue la pantalla.
    useEventSubscription({ tipo: 'TASK_FINISHED' }, () => setReloadCount((count) => count + 1));
    useEventSubscription({ tipo: 'INSTANCE_STATE_CHANGED' }, () => setReloadCount((count) => count + 1));

    const goToAudit = () => navigate('/auditoria');

    return (
        <Card className={style.card}>
            <div className={style.header}>
                <h4 className={style.title}>Actividad reciente</h4>
                <Button type="button" variant="ghost" className={style.headerAction} onClick={goToAudit}>
                    Ver todo
                </Button>
            </div>

            {isLoading ? (
                <div className="flex flex-col gap-3" aria-label="Cargando actividad reciente">
                    {[0, 1, 2, 3, 4].map((row) => <div key={row} className={style.rowSkeleton} />)}
                </div>
            ) : errorMessage ? (
                <div className={style.stateBox} role="alert">
                    <span>{errorMessage}</span>
                    <Button
                        type="button"
                        variant="outline"
                        className={style.stateAction}
                        onClick={() => setReloadCount((count) => count + 1)}
                    >
                        Reintentar
                    </Button>
                </div>
            ) : items.length === 0 ? (
                <div className={style.stateBox}>Todavía no hay actividad registrada.</div>
            ) : (
                <ul className={style.list}>
                    {items.map((item) => {
                        const theme = activityTheme(item.accion);
                        const Icon = theme.icon;
                        const subtitle = activitySubtitle(item);
                        return (
                            <li key={item.id} className={style.row}>
                                <span className={`${style.rowIcon} ${theme.className}`} aria-hidden="true">
                                    <Icon className={style.rowIconGlyph} />
                                </span>
                                <div className={style.rowBody}>
                                    <span className={style.rowName}>{activityLabel(item.accion)}</span>
                                    {subtitle && <span className={style.rowMeta}>{subtitle}</span>}
                                </div>
                                <div className={style.rowSide}>
                                    <span>{formatRelativeTime(item.fechaHora)}</span>
                                    {item.nombreUsuario && <span>{`por ${item.nombreUsuario}`}</span>}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            <Button type="button" variant="outline" className={style.footerAction} onClick={goToAudit}>
                Ver toda la actividad <ArrowRight className={style.footerIcon} />
            </Button>
        </Card>
    );
}

const style = {
    card: 'flex min-h-[340px] flex-col gap-3 rounded-xl border border-slate-100 bg-white p-5 shadow-sm ring-0',
    header: 'flex items-center justify-between gap-2',
    title: 'text-sm font-semibold text-slate-900',
    headerAction: 'h-8 px-2 text-xs text-slate-500',
    list: 'flex flex-1 flex-col divide-y divide-slate-100',
    row: 'flex items-center gap-3 py-3',
    rowIcon: 'flex size-9 shrink-0 items-center justify-center rounded-full',
    rowIconGlyph: 'size-4',
    rowBody: 'flex min-w-0 flex-1 flex-col',
    rowName: 'truncate text-sm font-medium text-slate-900',
    rowMeta: 'truncate text-xs text-slate-500',
    rowSide: 'flex shrink-0 flex-col items-end text-xs text-slate-500',
    rowSkeleton: 'h-12 animate-pulse rounded-lg border border-slate-100 bg-slate-100',
    stateBox: 'flex min-h-28 flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-slate-500',
    stateAction: 'h-8 text-xs',
    footerAction: 'mt-auto w-full justify-between text-xs text-blue-600',
    footerIcon: 'size-4!',
};
