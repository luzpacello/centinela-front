import { Fragment, useEffect, useState } from 'react';
import {
    Calendar,
    Filter,
    Download,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Eye,
    Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ApiRequestError, apiClient } from '@/services/apiClient';
import { getAccessToken } from '@/storage/tokenStorage';

const AUDIT_PAGE_SIZE = 10;
const EMPTY_TEXT = '—';

// Contrato real de GET /api/admin/audit (PaginaAuditoria + AuditoriaDTO).
interface AuditoriaItemDTO {
    id: string;
    usuarioId?: string | null;
    nombreUsuario?: string | null;
    fechaHora?: string | null;
    accion?: string | null;
    instanciaId?: string | null;
    instanciaNombre?: string | null;
    resultado?: string | null;
    detalles?: string | null;
}

interface PaginaAuditoriaDTO {
    total?: number;
    pagina?: number;
    items?: AuditoriaItemDTO[];
}

function displayText(value?: string | null): string {
    const text = typeof value === 'string' ? value.trim() : '';
    return text || EMPTY_TEXT;
}

function formatFechaHora(value?: string | null): string {
    if (!value) return EMPTY_TEXT;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

export default function AuditoriaPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [pagina, setPagina] = useState(1);
    const [accion, setAccion] = useState('');
    const [resultado, setResultado] = useState('');
    const [usuarioId, setUsuarioId] = useState('');
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');
    const [items, setItems] = useState<AuditoriaItemDTO[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [exportError, setExportError] = useState<string | null>(null);

    // Las métricas se calculan solo con lo que la API devuelve de verdad: el total
    // del período y el resultado de los registros de esta página. La API no expone
    // un desglose global por resultado, así que no se muestra ninguno.
    const exitososEnPagina = items.filter((item) => (item.resultado ?? '').toUpperCase() === 'EXITO').length;
    const fallidosEnPagina = items.filter((item) => (item.resultado ?? '').toUpperCase() === 'FALLA').length;

    useEffect(() => {
        const controller = new AbortController();

        async function loadAudit() {
            setIsLoading(true);
            setErrorMessage(null);
            try {
                const params = new URLSearchParams({
                    pagina: String(pagina),
                    tamano: String(AUDIT_PAGE_SIZE),
                });
                if (accion) params.set('accion', accion);
                if (resultado) params.set('resultado', resultado);
                if (usuarioId) params.set('usuarioId', usuarioId);
                if (desde) params.set('desde', desde);
                if (hasta) params.set('hasta', hasta);

                const data = await apiClient.get<PaginaAuditoriaDTO>(
                    `/admin/audit?${params.toString()}`,
                    { signal: controller.signal },
                );
                setItems(data.items ?? []);
                setTotal(data.total ?? 0);
            } catch (error) {
                if (controller.signal.aborted) return;
                setItems([]);
                setTotal(0);
                setErrorMessage(
                    error instanceof ApiRequestError
                        ? error.message
                        : 'No se pudo cargar el registro de auditoría. Intentá nuevamente.',
                );
            } finally {
                if (!controller.signal.aborted) setIsLoading(false);
            }
        }

        loadAudit();
        return () => controller.abort();
    }, [pagina, accion, resultado, usuarioId, desde, hasta]);

    // Todo cambio de filtro vuelve a la primera página.
    function updateFilter(setter: (value: string) => void, value: string) {
        setter(value);
        setPagina(1);
    }

    async function handleExport() {
        setExportError(null);
        try {
            const base = (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
            const token = getAccessToken();
            const response = await fetch(`${base}/admin/audit/export?formato=csv`, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                credentials: 'include',
            });
            if (!response.ok) {
                throw new Error('No se pudo exportar la auditoría.');
            }
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = 'auditoria.csv';
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(objectUrl);
        } catch {
            setExportError('No se pudo exportar la auditoría. Intentá nuevamente.');
        }
    }

    // El backend no expone búsqueda libre; el buscador filtra la página visible.
    const filteredAuditEvents = items.filter((event) =>
        Object.values(event).some((value) =>
            String(value ?? '').toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    // Opciones del filtro de usuario: se derivan de los registros visibles.
    const usuarioOptions = Array.from(
        new Map(
            items
                .filter((item) => item.usuarioId)
                .map((item) => [item.usuarioId as string, displayText(item.nombreUsuario)]),
        ),
    );

    const totalPages = Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE));
    const firstVisible = total === 0 ? 0 : (pagina - 1) * AUDIT_PAGE_SIZE + 1;
    const lastVisible = Math.min(pagina * AUDIT_PAGE_SIZE, total);
    const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)
        .filter((page) => page === 1 || page === totalPages || Math.abs(page - pagina) <= 1);

    const getResultBadge = (resultado?: string | null) => {
        const value = (resultado ?? '').toUpperCase();
        if (value === 'EXITO' || value === 'SUCCESS') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="size-3.5" /> Éxito
                </span>
            );
        }
        if (value === 'ADVERTENCIA' || value === 'WARNING') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    <AlertTriangle className="size-3.5" /> Advertencia
                </span>
            );
        }
        if (value === 'FALLA' || value === 'FALLIDO' || value === 'FAILED' || value === 'ERROR') {
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                    <XCircle className="size-3.5" /> Falla
                </span>
            );
        }
        return <span className="text-secundario">{displayText(resultado)}</span>;
    };

    return (
        <section className="flex min-w-0 flex-col gap-6 text-slate-900">
            {/* Cabecera de la página utilizando clases globales */}
            <div className="flex flex-wrap items-start justify-between gap-5 pb-1">
                <div>
                    <h1 className="mb-2 text-[30px] font-semibold tracking-tight text-slate-900">Auditoría</h1>
                    <p className="text-secundario">Registro completo de acciones realizadas en el sistema.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-64 max-w-full">
                        <Search className="pointer-events-none absolute top-3 left-3 z-10 size-4 text-slate-500" aria-hidden="true" />
                        <Input
                            className="pl-10"
                            placeholder="Buscar en auditoría..."
                            aria-label="Buscar en auditoría"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>
                    <Button type="button" variant="outline" onClick={handleExport}><Download className="size-4!" /> Exportar</Button>
                </div>
            </div>

            {exportError && <p role="alert" className="text-xs text-red-600">{exportError}</p>}

            {/* Tarjetas de Métricas Superiores */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Card className="flex flex-col justify-between rounded-xl border-slate-100 p-5 shadow-sm ring-0">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Eventos totales</span>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-metrica">{total}</span>
                        <span className="text-caption">En el período seleccionado</span>
                    </div>
                </Card>

                <Card className="flex flex-col justify-between rounded-xl border-slate-100 p-5 shadow-sm ring-0">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Exitosos</span>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-metrica text-emerald-600">{exitososEnPagina}</span>
                        <span className="text-caption">En esta página</span>
                    </div>
                </Card>

                <Card className="flex flex-col justify-between rounded-xl border-slate-100 p-5 shadow-sm ring-0">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Fallidos</span>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-metrica text-rose-600">{fallidosEnPagina}</span>
                        <span className="text-caption">En esta página</span>
                    </div>
                </Card>
            </div>

            {/* Barra de Filtros y Acciones */}
            <Card className="flex flex-col items-center justify-between gap-4 rounded-xl border-slate-100 p-4 shadow-sm ring-0 md:flex-row">
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Rango de fechas (desde / hasta) */}
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-700">
                        <Calendar className="size-4 text-slate-500" />
                        <input
                            type="date"
                            aria-label="Desde"
                            value={desde}
                            onChange={(event) => updateFilter(setDesde, event.target.value)}
                            className="bg-transparent outline-none"
                        />
                        <span>-</span>
                        <input
                            type="date"
                            aria-label="Hasta"
                            value={hasta}
                            onChange={(event) => updateFilter(setHasta, event.target.value)}
                            className="bg-transparent outline-none"
                        />
                    </div>

                    {/* Selector de usuarios */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-700">
                        <select
                            aria-label="Usuario"
                            value={usuarioId}
                            onChange={(event) => updateFilter(setUsuarioId, event.target.value)}
                            className="bg-transparent outline-none"
                        >
                            <option value="">Todos los usuarios</option>
                            {usuarioOptions.map(([id, nombre]) => (
                                <option key={id} value={id}>{nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro por acción */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-700">
                        <input
                            type="text"
                            aria-label="Acción"
                            placeholder="Acción (ej: LOGIN)"
                            value={accion}
                            onChange={(event) => updateFilter(setAccion, event.target.value)}
                            className="w-40 bg-transparent outline-none"
                        />
                    </div>

                    {/* Filtro por resultado */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-700">
                        <select
                            aria-label="Resultado"
                            value={resultado}
                            onChange={(event) => updateFilter(setResultado, event.target.value)}
                            className="bg-transparent outline-none"
                        >
                            <option value="">Todos los resultados</option>
                            <option value="EXITO">Éxito</option>
                            <option value="FALLA">Falla</option>
                        </select>
                    </div>

                    {/* Botón de filtros avanzados (solo visual) */}
                    <Button type="button" variant="outline"><Filter className="size-4!" /> Filtros</Button>
                </div>

                {/* Botón Exportar */}
            </Card>

            {/* Tabla de Registros */}
            <Card className="overflow-hidden rounded-xl border-slate-100 py-0 shadow-sm ring-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="border-b border-slate-100 bg-slate-50/60 text-slate-700">
                            <tr className="text-xs font-medium uppercase tracking-wider">
                                <th className="py-3.5 px-4">Fecha y hora</th>
                                <th className="py-3.5 px-4">Usuario</th>
                                <th className="py-3.5 px-4">Acción</th>
                                <th className="py-3.5 px-4">Recurso/instancia</th>
                                <th className="py-3.5 px-4">Nodo</th>
                                <th className="py-3.5 px-4">Resultado</th>
                                <th className="py-3.5 px-4">IP origen</th>
                                <th className="py-3.5 px-4 text-right">Detalles</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                            {isLoading &&
                                Array.from({ length: 4 }).map((_, index) => (
                                    <tr key={`skeleton-${index}`} className="animate-pulse">
                                        {Array.from({ length: 8 }).map((__, cell) => (
                                            <td key={cell} className="py-3 px-4"><div className="h-4 w-24 rounded bg-slate-100" /></td>
                                        ))}
                                    </tr>
                                ))}

                            {!isLoading && errorMessage && (
                                <tr>
                                    <td colSpan={8} className="py-10 px-4 text-center text-sm text-red-600" role="alert">
                                        {errorMessage}
                                    </td>
                                </tr>
                            )}

                            {!isLoading && !errorMessage && filteredAuditEvents.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="py-10 px-4 text-center text-sm text-slate-500">
                                        {items.length === 0
                                            ? 'Todavía no hay registros de auditoría para mostrar.'
                                            : 'No se encontraron registros que coincidan con la búsqueda.'}
                                    </td>
                                </tr>
                            )}

                            {!isLoading && !errorMessage && filteredAuditEvents.map((event) => (
                                <tr key={event.id} className="transition-colors hover:bg-slate-50/70">
                                    <td className="py-3 px-4 whitespace-nowrap text-secundario">{formatFechaHora(event.fechaHora)}</td>
                                    <td className="py-3 px-4 font-medium text-slate-900">{displayText(event.nombreUsuario)}</td>
                                    <td className="py-3 px-4">{displayText(event.accion)}</td>
                                    <td className="py-3 px-4 text-secundario">{displayText(event.instanciaNombre)}</td>
                                    <td className="py-3 px-4">
                                        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">
                                            {EMPTY_TEXT}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">{getResultBadge(event.resultado)}</td>
                                    <td className="py-3 px-4 font-mono text-xs text-secundario">{EMPTY_TEXT}</td>
                                    <td className="py-3 px-4 text-right">
                                        <button aria-label={`Ver detalles de ${displayText(event.accion)}`} title={event.detalles || undefined} className="inline-flex items-center justify-center rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
                                            <Eye className="size-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Paginación y Nota inferior */}
                <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 px-5 py-4 text-xs text-secundario sm:flex-row">
                    <div>
                        Mostrando <strong>{firstVisible} a {lastVisible}</strong> de <strong>{total}</strong> eventos
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <span>{AUDIT_PAGE_SIZE} por página</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                aria-label="Página anterior"
                                disabled={pagina <= 1}
                                onClick={() => setPagina((previous) => Math.max(1, previous - 1))}
                                className="p-1.5 rounded border border-border bg-card hover:bg-muted text-foreground transition-colors disabled:text-muted-foreground/50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="size-4" />
                            </button>
                            {pageNumbers.map((page, index) => (
                                <Fragment key={page}>
                                    {index > 0 && page - pageNumbers[index - 1] > 1 && (
                                        <span className="px-1 text-muted-foreground">...</span>
                                    )}
                                    <button
                                        type="button"
                                        aria-current={page === pagina ? 'page' : undefined}
                                        onClick={() => setPagina(page)}
                                        className={page === pagina
                                            ? 'rounded border border-blue-600 bg-blue-600 px-3 py-1 font-medium text-white'
                                            : 'rounded px-3 py-1 text-slate-700 hover:bg-slate-100'}
                                    >
                                        {page}
                                    </button>
                                </Fragment>
                            ))}
                            <button
                                type="button"
                                aria-label="Página siguiente"
                                disabled={pagina >= totalPages}
                                onClick={() => setPagina((previous) => Math.min(totalPages, previous + 1))}
                                className="p-1.5 rounded border border-border bg-card hover:bg-muted text-foreground transition-colors disabled:text-muted-foreground/50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="size-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Nota informativa inferior */}
            <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-900">
                <div className="mt-0.5 font-semibold text-blue-700">i</div>
                <div className="flex flex-col gap-0.5">
                    <span className="font-medium">Información sobre retención de registros</span>
                    <span className="text-xs text-blue-800/80">La auditoría registra acciones críticas realizadas por los usuarios en el sistema. Los registros se conservan por 90 días.</span>
                </div>
            </div>
        </section>
    );
}