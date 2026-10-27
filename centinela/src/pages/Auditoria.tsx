import { Fragment, useEffect, useState } from 'react';
import { format, startOfDay, subMonths } from 'date-fns';
import { useLocation, useSearchParams } from 'react-router';
import {
    Download,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Eye,
    Search,
    FileText,
    Clock3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import type { AuditDetalles } from '@/utils/auditDetalle';
import { AUDIT_ACTION_OPTIONS, HIDDEN_AUDIT_ACTIONS, auditActionLabel, auditStage } from '@/utils/auditActionLabels';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiRequestError, apiClient } from '@/services/apiClient';
import { getAccessToken } from '@/storage/tokenStorage';
import { useGuardiaRol } from '@/hooks/useGuardiaRol';
import { AuditDetailModal } from '@/components/features/audit/AuditDetailModal';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
// import { get } from '@/services/request';
// import { data } from 'react-router';

const AUDIT_PAGE_SIZE = 10;
const AUDIT_PAGE_SIZES = [10, 25, 50, 100] as const;
const AUDIT_RESOURCE_TYPES = ['VM', 'LXC', 'HOST', 'USER'] as const;
const EMPTY_TEXT = '—';

// Contrato real de GET /api/admin/audit (PaginaAuditoria + AuditoriaDTO).
interface AuditoriaItemDTO {
    id: string;
    usuarioId?: string | null;
    nombreUsuario?: string | null;
    fechaHora?: string | null;
    accion?: string | null;
    recursoTipo?: string | null;
    recursoId?: string | number | null;
    instanciaId?: string | null;
    instanciaNombre?: string | null;
    resultado?: string | null;
    detalles?: AuditDetalles;
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
    // Si el usuario tiene rol OPERATOR, el hook lo patea a /dashboard
    const estaAutorizado = useGuardiaRol(['OPERATOR']);
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigationState = location.state as { auditUser?: { id?: unknown; label?: unknown } } | null;
    const initialAuditUserId = typeof navigationState?.auditUser?.id === 'string' ? navigationState.auditUser.id : '';
    const initialAuditUserLabel = typeof navigationState?.auditUser?.label === 'string' ? navigationState.auditUser.label : initialAuditUserId;
    const [defaultDates] = useState(() => {
        const today = startOfDay(new Date());
        return { desde: format(subMonths(today, 1), 'yyyy-MM-dd'), hasta: format(today, 'yyyy-MM-dd') };
    });
    const [searchTerm, setSearchTerm] = useState(initialAuditUserLabel);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialAuditUserLabel);
    const pagina = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const requestedPageSize = Number.parseInt(searchParams.get('limit') ?? String(AUDIT_PAGE_SIZE), 10);
    const pageSize = AUDIT_PAGE_SIZES.includes(requestedPageSize as (typeof AUDIT_PAGE_SIZES)[number])
        ? requestedPageSize
        : AUDIT_PAGE_SIZE;
    const accion = searchParams.get('accion') ?? '';
    const resultado = searchParams.get('resultado') ?? '';
    const usuarioId = searchParams.get('usuario') ?? initialAuditUserId;
    const recursoTipo = searchParams.get('recursoTipo') ?? '';
    const desde = searchParams.get('desde') ?? defaultDates.desde;
    const hasta = searchParams.get('hasta') ?? defaultDates.hasta;
    const [items, setItems] = useState<AuditoriaItemDTO[]>([]);
    const [total, setTotal] = useState(0);
    const [resultCounts, setResultCounts] = useState<{ successes: number | null; failures: number | null }>({ successes: null, failures: null });
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [exportError, setExportError] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<AuditoriaItemDTO | null>(null);

    useEffect(() => {
        const hasMissingDefaults =
            !searchParams.has('page') ||
            !searchParams.has('limit') ||
            (!searchParams.has('desde') && !initialAuditUserId) ||
            (!searchParams.has('hasta') && !initialAuditUserId) ||
            (!searchParams.has('usuario') && Boolean(initialAuditUserId));
        if (!hasMissingDefaults) return;

        setSearchParams((current) => {
            const next = new URLSearchParams(current);
            if (!next.has('page')) next.set('page', '1');
            if (!next.has('limit')) next.set('limit', String(AUDIT_PAGE_SIZE));
            if (!initialAuditUserId && !next.has('desde')) next.set('desde', defaultDates.desde);
            if (!initialAuditUserId && !next.has('hasta')) next.set('hasta', defaultDates.hasta);
            if (initialAuditUserId && !next.has('usuario')) next.set('usuario', initialAuditUserId);
            return next;
        }, { replace: true });
    }, [defaultDates.desde, defaultDates.hasta, initialAuditUserId, searchParams, setSearchParams]);

    useEffect(() => {
        const timeout = window.setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
        return () => window.clearTimeout(timeout);
    }, [searchTerm]);

    function updateUrlFilter(name: string, value: string) {
        setSearchParams((current) => {
            const next = new URLSearchParams(current);
            if (value) next.set(name, value);
            else next.delete(name);
            next.set('page', '1');
            return next;
        }, { replace: true });
    }

    function updatePage(page: number) {
        setSearchParams((current) => {
            const next = new URLSearchParams(current);
            next.set('page', String(Math.max(1, page)));
            return next;
        }, { replace: true });
    }

    useEffect(() => {
        if (!estaAutorizado) {
            return;
        }

        const controller = new AbortController();

        async function loadAudit() {
            setIsLoading(true);
            setErrorMessage(null);
            try {
                const params = new URLSearchParams({
                    pagina: String(pagina),
                    tamano: String(pageSize),
                    excluirAccion: HIDDEN_AUDIT_ACTIONS.join(','),
                });
                if (accion) params.set('accion', accion);
                if (resultado) params.set('resultado', resultado);
                if (usuarioId) params.set('usuarioId', usuarioId);
                if (recursoTipo) params.set('recursoTipo', recursoTipo);
                if (desde) params.set('desde', desde);
                if (hasta) params.set('hasta', hasta);

                const data = await apiClient.get<PaginaAuditoriaDTO>(
                    `/admin/audit?${params.toString()}`,
                    { signal: controller.signal },
                );
                if (controller.signal.aborted) return;
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
    }, [estaAutorizado, pagina, pageSize, accion, resultado, usuarioId, recursoTipo, desde, hasta]);

    useEffect(() => {
        if (!estaAutorizado) return;

        const controller = new AbortController();
        const params = new URLSearchParams({
            pagina: '1',
            tamano: String(pageSize),
            excluirAccion: HIDDEN_AUDIT_ACTIONS.join(','),
        });
        if (accion) params.set('accion', accion);
        if (resultado) params.set('resultado', resultado);
        if (usuarioId) params.set('usuarioId', usuarioId);
        if (recursoTipo) params.set('recursoTipo', recursoTipo);
        if (desde) params.set('desde', desde);
        if (hasta) params.set('hasta', hasta);

        async function loadResultCounts() {
            setResultCounts({ successes: null, failures: null });
            try {
                const successParams = new URLSearchParams(params);
                const failureParams = new URLSearchParams(params);
                successParams.set('resultado', 'EXITO');
                failureParams.set('resultado', 'FALLA');
                const [successes, failures] = await Promise.all([
                    apiClient.get<PaginaAuditoriaDTO>(`/admin/audit?${successParams.toString()}`, { signal: controller.signal }),
                    apiClient.get<PaginaAuditoriaDTO>(`/admin/audit?${failureParams.toString()}`, { signal: controller.signal }),
                ]);
                if (!controller.signal.aborted) {
                    setResultCounts({ successes: successes.total ?? 0, failures: failures.total ?? 0 });
                }
            } catch {
                if (!controller.signal.aborted) setResultCounts({ successes: null, failures: null });
            }
        }

        void loadResultCounts();
        return () => controller.abort();
    }, [estaAutorizado, pageSize, accion, resultado, usuarioId, recursoTipo, desde, hasta]);

    if (!estaAutorizado) {
        return null;
    }

    async function handleExport() {
        setExportError(null);
        try {
            const base = (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
            const token = getAccessToken();
            const params = new URLSearchParams({
                formato: 'csv',
                excluirAccion: HIDDEN_AUDIT_ACTIONS.join(','),
            });
            if (accion) params.set('accion', accion);
            if (resultado) params.set('resultado', resultado);
            if (usuarioId) params.set('usuarioId', usuarioId);
            if (recursoTipo) params.set('recursoTipo', recursoTipo);
            if (desde) params.set('desde', desde);
            if (hasta) params.set('hasta', hasta);

            const response = await fetch(`${base}/admin/audit/export?${params.toString()}`, {
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
    const effectiveSearchTerm = initialAuditUserId && usuarioId === initialAuditUserId && debouncedSearchTerm === initialAuditUserLabel
        ? ''
        : debouncedSearchTerm;
    const filteredAuditEvents = items.filter((event) =>
        Object.values(event).some((value) =>
            String(value ?? '').toLowerCase().includes(effectiveSearchTerm.toLowerCase())
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

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const firstVisible = total === 0 ? 0 : (pagina - 1) * pageSize + 1;
    const lastVisible = Math.min(pagina * pageSize, total);
    const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)
        .filter((page) => page === 1 || page === totalPages || Math.abs(page - pagina) <= 1);
    const activeResultTab = resultado === 'EXITO' || resultado === 'SUCCESS'
        ? 'EXITO'
        : resultado === 'FALLA' || resultado === 'FAILED'
            ? 'FALLA'
            : 'all';

    const getResultBadge = (resultado?: string | null) => {
        const value = (resultado ?? '').toUpperCase();
        if (value === 'PENDIENTE' || value === 'PENDING') {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                    <Clock3 className="size-3.5" /> En curso
                </span>
            );
        }
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
        if (value === 'FALLA' || value === 'FALLO' || value === 'FALLIDO' || value === 'FAILED' || value === 'ERROR') {
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
            <div className="flex flex-col gap-4 pb-1">
                <div className="flex flex-wrap items-start justify-between gap-5">
                    <div>
                        <h1 className="mb-2 text-[30px] font-semibold tracking-tight text-slate-900">Auditoría</h1>
                        <p className="text-secundario">Registro completo de acciones realizadas en el sistema.</p>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="relative w-64 max-w-full">
                            <Search className="pointer-events-none absolute top-3 left-3 z-10 size-4 text-slate-500" aria-hidden="true" />
                            <Input
                                className="pl-10"
                                placeholder="Buscar en auditoría..."
                                aria-label="Buscar en auditoría"
                                aria-describedby="audit-search-hint"
                                value={searchTerm}
                                onChange={(event) => {
                                    setSearchTerm(event.target.value);
                                    updatePage(1);
                                }}
                            />
                            <span id="audit-search-hint" className="sr-only">La búsqueda se aplica a los resultados de la página actual.</span>
                        </div>
                        <Button type="button" onClick={handleExport}>
                            <Download className="size-4!" /> Exportar CSV
                        </Button>
                    </div>
                </div>

                <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                            Desde
                            <Input
                                type="date"
                                aria-label="Desde"
                                value={desde}
                                max={hasta || undefined}
                                onChange={(event) => updateUrlFilter('desde', event.target.value)}
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                            Hasta
                            <Input
                                type="date"
                                aria-label="Hasta"
                                value={hasta}
                                min={desde || undefined}
                                max={format(startOfDay(new Date()), 'yyyy-MM-dd')}
                                onChange={(event) => updateUrlFilter('hasta', event.target.value)}
                            />
                        </label>
                        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                            Acción
                            <select
                                className="h-10 min-w-0 rounded-md border border-slate-300 bg-white px-3 text-sm"
                                aria-label="Acción"
                                value={accion}
                                onChange={(event) => updateUrlFilter('accion', event.target.value)}
                            >
                                <option value="">Todas</option>
                                {AUDIT_ACTION_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                            Usuario
                            <select
                                className="h-10 min-w-0 rounded-md border border-slate-300 bg-white px-3 text-sm"
                                aria-label="Usuario"
                                value={usuarioId}
                                onChange={(event) => {
                                    updateUrlFilter('usuario', event.target.value);
                                    setSearchTerm('');
                                }}
                            >
                                <option value="">Todos</option>
                                {usuarioId && !usuarioOptions.some(([id]) => id === usuarioId) && (
                                    <option value={usuarioId}>{initialAuditUserLabel || usuarioId}</option>
                                )}
                                {usuarioOptions.map(([id, nombre]) => (
                                    <option key={id} value={id}>{nombre}</option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                            Tipo de recurso
                            <select
                                className="h-10 min-w-0 rounded-md border border-slate-300 bg-white px-3 text-sm"
                                aria-label="Tipo de recurso"
                                value={recursoTipo}
                                onChange={(event) => updateUrlFilter('recursoTipo', event.target.value)}
                            >
                                <option value="">Todos</option>
                                {AUDIT_RESOURCE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                            Resultado
                            <select
                                className="h-10 min-w-0 rounded-md border border-slate-300 bg-white px-3 text-sm"
                                aria-label="Resultado"
                                value={resultado}
                                onChange={(event) => updateUrlFilter('resultado', event.target.value)}
                            >
                                <option value="">Todos</option>
                                <option value="SUCCESS">SUCCESS</option>
                                <option value="FAILED">FAILED</option>
                                <option value="PENDING">PENDING</option>
                                <option value="WARNING">WARNING</option>
                            </select>
                        </label>
                </div>
            </div>

            {exportError && <p role="alert" className="text-xs text-red-600">{exportError}</p>}

            <Tabs value={activeResultTab} onValueChange={(value) => updateUrlFilter('resultado', value === 'all' ? '' : value)} className="min-w-0 gap-4">
                <TabsList variant="line" aria-label="Resultado" className="max-w-full">
                    <TabsTrigger value="all" className="px-4"><FileText /> Eventos totales <Badge variant="secondary">{total}</Badge></TabsTrigger>
                    <TabsTrigger value="EXITO" className="px-4"><CheckCircle2 /> Exitosos <Badge variant="secondary">{resultCounts.successes ?? EMPTY_TEXT}</Badge></TabsTrigger>
                    <TabsTrigger value="FALLA" className="px-4"><XCircle /> Fallidos <Badge variant="secondary">{resultCounts.failures ?? EMPTY_TEXT}</Badge></TabsTrigger>
                </TabsList>
                <TabsContent value={activeResultTab} className="min-w-0">
                    {/* Tabla de Registros */}
                    <Card className="min-w-0 overflow-hidden rounded-xl border-slate-100 py-0 shadow-sm ring-0">
                        <Table className="min-w-[52rem] text-xs text-slate-700" aria-busy={isLoading}>
                            <TableHeader>
                                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                                    <TableHead className="header-of-table px-4">Fecha y hora</TableHead>
                                    <TableHead className="header-of-table px-4">Usuario</TableHead>
                                    <TableHead className="header-of-table px-4">Acción</TableHead>
                                    <TableHead className="header-of-table px-4">Recurso/instancia</TableHead>
                                    <TableHead className="header-of-table px-4">Resultado</TableHead>
                                    <TableHead className="header-of-table px-4 text-right">Detalles</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading && items.length === 0 &&
                                    Array.from({ length: 4 }).map((_, index) => (
                                        <TableRow key={`skeleton-${index}`} className="animate-pulse">
                                            {Array.from({ length: 6 }).map((__, cell) => (
                                                <TableCell key={cell} className="p-4"><div className="h-4 w-24 rounded bg-slate-100" /></TableCell>
                                            ))}
                                        </TableRow>
                                    ))}

                                {!isLoading && errorMessage && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="px-4 py-10 text-center text-sm text-red-600" role="alert">
                                            {errorMessage}
                                        </TableCell>
                                    </TableRow>
                                )}

                                {!isLoading && !errorMessage && filteredAuditEvents.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                                            {items.length === 0
                                                ? 'Todavía no hay registros de auditoría para mostrar.'
                                                : 'No se encontraron registros que coincidan con la búsqueda.'}
                                        </TableCell>
                                    </TableRow>
                                )}

                                {!errorMessage && filteredAuditEvents.map((event) => {
                                    const stage = auditStage(event.accion, event.resultado);
                                    const actionLabel = auditActionLabel(event.accion);

                                    return (
                                        <TableRow key={event.id} className="hover:bg-slate-50/70">
                                            <TableCell className="p-4 text-secundario">{formatFechaHora(event.fechaHora)}</TableCell>
                                            <TableCell className="p-4 font-medium text-slate-900">{displayText(event.nombreUsuario)}</TableCell>
                                            <TableCell className="p-4">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {stage && (
                                                        <Badge
                                                            variant="outline"
                                                            className={stage === 'Inicio'
                                                                ? 'border-sky-200 bg-sky-50 text-sky-700'
                                                                : 'border-slate-200 bg-slate-50 text-slate-600'}
                                                        >
                                                            {stage}
                                                        </Badge>
                                                    )}
                                                    <span>{actionLabel}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-4 text-secundario">
                                                {displayText(
                                                    [event.recursoTipo, event.recursoId ?? event.instanciaId, event.instanciaNombre]
                                                        .filter((part) => part !== null && part !== undefined && String(part).trim())
                                                        .join(' · ') || event.instanciaNombre,
                                                )}
                                            </TableCell>
                                            <TableCell className="p-4">{getResultBadge(event.resultado)}</TableCell>
                                            <TableCell className="p-4 text-right">
                                                <button
                                                    type="button"
                                                    aria-label={`Ver detalles de ${actionLabel}`}
                                                    onClick={() => setSelectedEvent(event)}
                                                    className="inline-flex items-center justify-center rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                                                >
                                                    <Eye className="size-4" />
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>

                        {/* Paginación y Nota inferior */}
                        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 px-5 py-4 text-xs text-secundario sm:flex-row">
                            <div>
                                Página {pagina} de {totalPages} ({total} eventos en total)
                                <span className="sr-only">. Mostrando {firstVisible} a {lastVisible}.</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2" htmlFor="audit-page-size">
                                    Registros por página
                                    <select
                                        id="audit-page-size"
                                        aria-label="Registros por página"
                                        className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900"
                                        value={pageSize}
                                        onChange={(event) => {
                                            setSearchParams((current) => {
                                                const next = new URLSearchParams(current);
                                                next.set('limit', event.target.value);
                                                next.set('page', '1');
                                                return next;
                                            }, { replace: true });
                                        }}
                                    >
                                        {AUDIT_PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
                                    </select>
                                </label>
                                <Pagination className="mx-0 w-auto justify-end">
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                text="Anterior"
                                                aria-label="Anterior"
                                                aria-disabled={pagina <= 1}
                                                tabIndex={pagina <= 1 ? -1 : 0}
                                                className={pagina <= 1 ? 'pointer-events-none opacity-50' : undefined}
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    updatePage(pagina - 1);
                                                }}
                                            />
                                        </PaginationItem>
                                        {pageNumbers.map((page, index) => (
                                            <Fragment key={page}>
                                                {index > 0 && page - pageNumbers[index - 1] > 1 && (
                                                    <PaginationItem>
                                                        <PaginationEllipsis />
                                                    </PaginationItem>
                                                )}
                                                <PaginationItem>
                                                    <PaginationLink
                                                        href="#"
                                                        size="icon"
                                                        isActive={page === pagina}
                                                        aria-label={`Página ${page}`}
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            updatePage(page);
                                                        }}
                                                    >
                                                        {page}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            </Fragment>
                                        ))}
                                        <PaginationItem>
                                            <PaginationNext
                                                href="#"
                                                text="Siguiente"
                                                aria-label="Siguiente"
                                                aria-disabled={pagina >= totalPages}
                                                tabIndex={pagina >= totalPages ? -1 : 0}
                                                className={pagina >= totalPages ? 'pointer-events-none opacity-50' : undefined}
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    updatePage(pagina + 1);
                                                }}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Nota informativa inferior */}
            <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-900">
                <div className="mt-0.5 font-semibold text-blue-700">i</div>
                <div className="flex flex-col gap-0.5">
                    <span className="font-medium">Información sobre retención de registros</span>
                    <span className="text-xs text-blue-800/80">La auditoría registra acciones críticas realizadas por los usuarios en el sistema. Los registros se conservan por 90 días.</span>
                </div>
            </div>
            {selectedEvent && (
                <AuditDetailModal
                    action={auditActionLabel(selectedEvent.accion)}
                    details={selectedEvent.detalles}
                    onClose={() => setSelectedEvent(null)}
                />
            )}
        </section>
    );
}
