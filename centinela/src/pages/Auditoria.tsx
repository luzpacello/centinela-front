import { Fragment, useEffect, useState } from 'react';
import {
    Calendar,
    Filter,
    Download,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Eye,
    Search,
    ListFilter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
    // Si el usuario tiene rol OPERATOR, el hook lo patea a /dashboard
    const estaAutorizado = useGuardiaRol(['OPERATOR']);
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
    }, [estaAutorizado, pagina, accion, resultado, usuarioId, desde, hasta]);

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
            const params = new URLSearchParams({ formato: 'csv' });
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
                    <DropdownMenu>
                        <DropdownMenuTrigger><Filter className="size-4!" /> Filtros</DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-72 max-w-[calc(100vw-2rem)]">
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>Rango de fechas</DropdownMenuLabel>
                                <div className="flex flex-wrap items-center gap-2 px-1.5 py-2 text-sm text-slate-700">
                                    <Calendar className="size-4 text-slate-500" aria-hidden="true" />
                                    <input type="date" aria-label="Desde" value={desde} onChange={(event) => updateFilter(setDesde, event.target.value)} className="min-w-0 bg-transparent outline-none" />
                                    <span>-</span>
                                    <input type="date" aria-label="Hasta" value={hasta} onChange={(event) => updateFilter(setHasta, event.target.value)} className="min-w-0 bg-transparent outline-none" />
                                </div>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={usuarioId || 'all'} onValueChange={(value) => updateFilter(setUsuarioId, value === 'all' ? '' : value)}>
                                <DropdownMenuLabel>Usuario</DropdownMenuLabel>
                                <DropdownMenuRadioItem value="all">Todos los usuarios</DropdownMenuRadioItem>
                                {usuarioOptions.map(([id, nombre]) => (
                                    <DropdownMenuRadioItem key={id} value={id}>{nombre}</DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={accion || 'all'} onValueChange={(value) => updateFilter(setAccion, value === 'all' ? '' : value)}>
                                <DropdownMenuLabel>Acción</DropdownMenuLabel>
                                <DropdownMenuRadioItem value="all">Todas las acciones</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="LOGIN">Login</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="LOGOUT">Logout</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="CREAR_USUARIO">Crear usuario</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="EDITAR_USUARIO">Editar usuario</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="ELIMINAR_USUARIO">Eliminar usuario</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="CREAR_ROL">Crear rol</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="EDITAR_ROL">Editar rol</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="EXPORTAR_AUDITORIA">Exportar auditoría</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {exportError && <p role="alert" className="text-xs text-red-600">{exportError}</p>}

            <Tabs value={resultado || 'all'} onValueChange={(value) => updateFilter(setResultado, value === 'all' ? '' : value)} className="min-w-0 gap-4">
                <TabsList variant="line" aria-label="Filtrar eventos de auditoría" className="max-w-full">
                    <TabsTrigger value="all" className="px-4"><ListFilter /> Eventos totales <Badge variant="secondary">{total}</Badge></TabsTrigger>
                    <TabsTrigger value="EXITO" className="px-4"><CheckCircle2 /> Exitosos <Badge variant="secondary">{exitososEnPagina}</Badge></TabsTrigger>
                    <TabsTrigger value="FALLA" className="px-4"><XCircle /> Fallidos <Badge variant="secondary">{fallidosEnPagina}</Badge></TabsTrigger>
                </TabsList>
                <TabsContent value={resultado || 'all'} className="min-w-0">
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
                                <th className="py-3.5 px-4">Resultado</th>
                                <th className="py-3.5 px-4 text-right">Detalles</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                            {isLoading &&
                                Array.from({ length: 4 }).map((_, index) => (
                                    <tr key={`skeleton-${index}`} className="animate-pulse">
                                        {Array.from({ length: 6 }).map((__, cell) => (
                                            <td key={cell} className="py-3 px-4"><div className="h-4 w-24 rounded bg-slate-100" /></td>
                                        ))}
                                    </tr>
                                ))}

                            {!isLoading && errorMessage && (
                                <tr>
                                    <td colSpan={6} className="py-10 px-4 text-center text-sm text-red-600" role="alert">
                                        {errorMessage}
                                    </td>
                                </tr>
                            )}

                            {!isLoading && !errorMessage && filteredAuditEvents.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-10 px-4 text-center text-sm text-slate-500">
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
                                    <td className="py-3 px-4">{getResultBadge(event.resultado)}</td>
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
