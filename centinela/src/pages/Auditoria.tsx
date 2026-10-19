import { Fragment, useEffect, useState } from 'react';
import { format, startOfDay, subMonths } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { useLocation } from 'react-router';
import {
    Filter,
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
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { detalleCompleto, type AuditDetalles } from '@/utils/auditDetalle';
import { AUDIT_ACTION_OPTIONS, HIDDEN_AUDIT_ACTIONS, auditActionLabel, auditStage } from '@/utils/auditActionLabels';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropDownMenu';
import { ApiRequestError, apiClient } from '@/services/apiClient';
import { getAccessToken } from '@/storage/tokenStorage';
import { useGuardiaRol } from '@/hooks/useGuardiaRol';
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
    const navigationState = location.state as { auditUser?: { id?: unknown; label?: unknown } } | null;
    const initialAuditUserId = typeof navigationState?.auditUser?.id === 'string' ? navigationState.auditUser.id : '';
    const initialAuditUserLabel = typeof navigationState?.auditUser?.label === 'string' ? navigationState.auditUser.label : initialAuditUserId;
    const [searchTerm, setSearchTerm] = useState(initialAuditUserLabel);
    const [pagina, setPagina] = useState(1);
    const [accion, setAccion] = useState('');
    const [resultado, setResultado] = useState('');
    const [usuarioId, setUsuarioId] = useState(initialAuditUserId);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        if (initialAuditUserId) return undefined;
        const today = startOfDay(new Date());
        return { from: subMonths(today, 1), to: today };
    });
    const desde = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '';
    const hasta = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : '';
    const [items, setItems] = useState<AuditoriaItemDTO[]>([]);
    const [total, setTotal] = useState(0);
    const [resultCounts, setResultCounts] = useState<{ successes: number | null; failures: number | null }>({ successes: null, failures: null });
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [exportError, setExportError] = useState<string | null>(null);

    // useEffect(() => {
    //     get("/api/admin/audit?pagina=1&tamano=10").then(data => console.log("imprimir data ", data))
    // }, [])

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
                    tamano: String(AUDIT_PAGE_SIZE),
                    excluirAccion: HIDDEN_AUDIT_ACTIONS.join(','),
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
    }, [estaAutorizado, pagina, accion, resultado, usuarioId, desde, hasta]);

    useEffect(() => {
        if (!estaAutorizado) return;

        const controller = new AbortController();
        const params = new URLSearchParams({
            pagina: '1',
            tamano: String(AUDIT_PAGE_SIZE),
            excluirAccion: HIDDEN_AUDIT_ACTIONS.join(','),
        });
        if (accion) params.set('accion', accion);
        if (usuarioId) params.set('usuarioId', usuarioId);
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
    }, [estaAutorizado, accion, usuarioId, desde, hasta]);

    if (!estaAutorizado) {
        return null;
    }

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
            const params = new URLSearchParams({
                formato: 'csv',
                excluirAccion: HIDDEN_AUDIT_ACTIONS.join(','),
            });
            if (accion) params.set('accion', accion);
            if (resultado) params.set('resultado', resultado);
            if (usuarioId) params.set('usuarioId', usuarioId);
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
    const effectiveSearchTerm = initialAuditUserId && usuarioId === initialAuditUserId && searchTerm === initialAuditUserLabel ? '' : searchTerm;
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

    const totalPages = Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE));
    const firstVisible = total === 0 ? 0 : (pagina - 1) * AUDIT_PAGE_SIZE + 1;
    const lastVisible = Math.min(pagina * AUDIT_PAGE_SIZE, total);
    const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)
        .filter((page) => page === 1 || page === totalPages || Math.abs(page - pagina) <= 1);

    const getResultBadge = (resultado?: string | null) => {
        const value = (resultado ?? '').toUpperCase();
        if (value === 'PENDIENTE' || value === 'PENDING') {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
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
                    <DropdownMenu>
                        <DropdownMenuTrigger><Filter className="size-4!" /> Filtros</DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[260px] max-w-[calc(100vw-2rem)]">
                            <DropdownMenuGroup className="[&_[data-slot=field]]:mx-0 [&_[data-slot=field]]:w-full">
                                <DropdownMenuLabel>Rango de fecha</DropdownMenuLabel>
                                <DatePickerWithRange
                                    value={dateRange}
                                    onValueChange={(range) => {
                                        setDateRange(range);
                                        setPagina(1);
                                    }}
                                    aria-label="Desde / Hasta"
                                    maxDate={startOfDay(new Date())}
                                    showLabel={false}
                                />
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup aria-label="Usuario" value={usuarioId || 'all'} onValueChange={(value) => {
                                updateFilter(setUsuarioId, value === 'all' ? '' : value);
                                setSearchTerm(value === initialAuditUserId ? initialAuditUserLabel : '');
                            }}>
                                <DropdownMenuLabel>Usuario</DropdownMenuLabel>
                                <DropdownMenuRadioItem value="all">Todos los usuarios</DropdownMenuRadioItem>
                                {usuarioOptions.map(([id, nombre]) => (
                                    <DropdownMenuRadioItem key={id} value={id}>{nombre}</DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup aria-label="Acción" value={accion || 'all'} onValueChange={(value) => updateFilter(setAccion, value === 'all' ? '' : value)}>
                                <DropdownMenuLabel>Acción</DropdownMenuLabel>
                                <DropdownMenuRadioItem value="all">Todas las acciones</DropdownMenuRadioItem>
                                {AUDIT_ACTION_OPTIONS.map((option) => (
                                    <DropdownMenuRadioItem key={option.value} value={option.value}>
                                        {option.label}
                                    </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button type="button" onClick={handleExport}><Download className="size-4!" /> Exportar</Button>
                </div>
            </div>

            {exportError && <p role="alert" className="text-xs text-red-600">{exportError}</p>}

            <Tabs value={resultado || 'all'} onValueChange={(value) => updateFilter(setResultado, value === 'all' ? '' : value)} className="min-w-0 gap-4">
                <TabsList variant="line" aria-label="Resultado" className="max-w-full">
                    <TabsTrigger value="all" className="px-4"><FileText /> Eventos totales <Badge variant="secondary">{total}</Badge></TabsTrigger>
                    <TabsTrigger value="EXITO" className="px-4"><CheckCircle2 /> Exitosos <Badge variant="secondary">{resultCounts.successes ?? EMPTY_TEXT}</Badge></TabsTrigger>
                    <TabsTrigger value="FALLA" className="px-4"><XCircle /> Fallidos <Badge variant="secondary">{resultCounts.failures ?? EMPTY_TEXT}</Badge></TabsTrigger>
                </TabsList>
                <TabsContent value={resultado || 'all'} className="min-w-0">
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
                            {isLoading &&
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

                            {!isLoading && !errorMessage && filteredAuditEvents.map((event) => {
                                const stage = auditStage(event.accion, event.resultado);
                                const actionLabel = auditActionLabel(event.accion);
                                const technicalDetail = [event.accion, detalleCompleto(event.detalles)].filter(Boolean).join('\n\n');

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
                                        <TableCell className="p-4 text-secundario">{displayText(event.instanciaNombre)}</TableCell>
                                        <TableCell className="p-4">{getResultBadge(event.resultado)}</TableCell>
                                        <TableCell className="p-4 text-right">
                                            <button aria-label={`Ver detalles de ${actionLabel}`} title={technicalDetail || undefined} className="inline-flex items-center justify-center rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
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
                        Mostrando <strong>{firstVisible} a {lastVisible}</strong> de <strong>{total}</strong> eventos
                    </div>

                        <div className="flex items-center gap-3">
                            <span>{AUDIT_PAGE_SIZE} por página</span>
                            <Pagination className="mx-0 w-auto justify-end">
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href="#"
                                            aria-disabled={pagina <= 1}
                                            tabIndex={pagina <= 1 ? -1 : 0}
                                            className={pagina <= 1 ? 'pointer-events-none opacity-50' : undefined}
                                            onClick={(event) => {
                                                event.preventDefault();
                                                setPagina((previous) => Math.max(1, previous - 1));
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
                                                        setPagina(page);
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
                                            aria-disabled={pagina >= totalPages}
                                            tabIndex={pagina >= totalPages ? -1 : 0}
                                            className={pagina >= totalPages ? 'pointer-events-none opacity-50' : undefined}
                                            onClick={(event) => {
                                                event.preventDefault();
                                                setPagina((previous) => Math.min(totalPages, previous + 1));
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
        </section>
    );
}
