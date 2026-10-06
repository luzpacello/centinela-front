import { useState } from 'react';
import { ChevronLeft, ChevronRight, CirclePlay, Container, Filter, Monitor, Plus, Search, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useInstances } from '@/components/features/instances/hooks/useInstances';
import InstanceAction from '@/components/features/instances/components/InstanceAction';
import { InstanceTypeBadge, InstanceStatusBadge } from '@/components/features/instances/components/InstanceBadges';
import { InstanceIpAddress } from '@/components/features/instances/components/InstanceIpAddress';
import { formatCpuUsage, formatRamUsage } from '@/components/features/instances/utils/formatInstanceTelemetry';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropDownMenu';
import type { InstanceType } from '@/components/features/instances/types/instance';

const INSTANCES_PER_PAGE = 10;

export default function Instances() {
    const { user, isAdmin, canAccessInstance } = useAuth();
    const { instances, isLoading, errorMessage, reloadInventory } = useInstances();
    const visibleInstances = instances.filter((instance) => canAccessInstance(instance.id));
    const runningInstanceCount = visibleInstances.filter((instance) => instance.status === 'running').length;
    const stoppedInstanceCount = visibleInstances.filter((instance) => instance.status === 'stopped').length;
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'stopped'>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | InstanceType>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const normalizedSearch = search.trim().toLocaleLowerCase('es');
    const filteredInstances = visibleInstances.filter((instance) =>
        (statusFilter === 'all' || instance.status === statusFilter)
        && (typeFilter === 'all' || instance.type === typeFilter)
        && [instance.id, instance.name, instance.type, instance.node, instance.ip ?? '']
            .some((value) => String(value).toLocaleLowerCase('es').includes(normalizedSearch)));
    const totalPages = Math.max(1, Math.ceil(filteredInstances.length / INSTANCES_PER_PAGE));
    const firstInstanceIndex = (currentPage - 1) * INSTANCES_PER_PAGE;
    const paginatedInstances = filteredInstances.slice(firstInstanceIndex, firstInstanceIndex + INSTANCES_PER_PAGE);
    const firstVisibleInstance = filteredInstances.length === 0 ? 0 : firstInstanceIndex + 1;
    const lastVisibleInstance = Math.min(firstInstanceIndex + INSTANCES_PER_PAGE, filteredInstances.length);

    return (
        <section className={style.page}>
            <header className={style.header}>
                <div>
                    <h1>Inventario de instancias</h1>
                    <p className="text-secundario">Administrá todas tus máquinas virtuales y contenedores.</p>
                </div>
                <div className={style.headerActions}>
                    <div className={style.search}>
                        <Search className={style.searchIcon} aria-hidden="true" />
                        <Input className={style.searchInput} placeholder="Buscar instancia..." aria-label="Buscar instancia"
                            value={search} onChange={(event) => {
                                setSearch(event.target.value);
                                setCurrentPage(1);
                            }} />
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger aria-label="Filtrar por tipo de instancia">
                            <Filter className={style.smallIcon} /> {typeFilter === 'all' ? 'Filtros' : `Filtros: ${typeFilter}`}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                            <DropdownMenuRadioGroup value={typeFilter} onValueChange={(value) => {
                                if (value === 'all' || value === 'VM' || value === 'LXC') {
                                    setTypeFilter(value);
                                    setCurrentPage(1);
                                }
                            }}>
                                <DropdownMenuLabel>Seleccionar tipo de instancia:</DropdownMenuLabel>
                                <DropdownMenuRadioItem value="VM">
                                    <Monitor aria-hidden="true" /> VM (Máquina virtual)
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="LXC">
                                    <Container aria-hidden="true" /> LXC (Contenedor)
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="all">
                                    Ver todas las instancias
                                </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {isAdmin() && <Button type="button"><Plus className={style.smallIcon} /> Crear instancia</Button>}
                </div>
            </header>

            <Tabs value={statusFilter} onValueChange={(value) => {
                if (value === 'all' || value === 'running' || value === 'stopped') {
                    setStatusFilter(value);
                    setCurrentPage(1);
                }
            }} className="min-w-0 gap-4">
                <div className={style.inventoryToolbar}>
                    <TabsList variant="line" aria-label="Filtrar instancias por estado" className="max-w-full">
                        <TabsTrigger value="all" className="px-4"><Monitor /> Instancias totales <Badge variant="secondary">{visibleInstances.length}</Badge></TabsTrigger>
                        <TabsTrigger value="running" className="px-4"><CirclePlay /> En ejecución <Badge variant="secondary">{runningInstanceCount}</Badge></TabsTrigger>
                        <TabsTrigger value="stopped" className="px-4"><Square /> Detenidas <Badge variant="secondary">{stoppedInstanceCount}</Badge></TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value={statusFilter} className="min-w-0">
                    <Card className={style.inventoryCard}>
                        <Table className={style.table} aria-label="Inventario de instancias" aria-busy={isLoading}>
                            <TableHeader>
                                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                                    <TableHead></TableHead>
                                    <TableHead className={style.tableHeading}>ID</TableHead>
                                    <TableHead className={style.tableHeading}>Nombre</TableHead>
                                    <TableHead className={style.tableHeading}>Tipo</TableHead>
                                    <TableHead className={style.tableHeading}>Estado</TableHead>
                                    <TableHead className={style.tableHeading}>Nodo</TableHead>
                                    <TableHead className={style.tableHeading}>CPU</TableHead>
                                    <TableHead className={style.tableHeading}>RAM</TableHead>
                                    <TableHead className={style.tableHeading}>Dirección IP</TableHead>
                                    <TableHead className={`${style.tableHeading} text-right`}>Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={11} className={style.emptyState} role="status">Cargando instancias…</TableCell></TableRow>
                                ) : errorMessage ? (
                                    <TableRow><TableCell colSpan={11} className={style.emptyState}>
                                        <p role="alert">{errorMessage}</p>
                                        <Button type="button" variant="outline" onClick={reloadInventory}>Reintentar</Button>
                                    </TableCell></TableRow>
                                ) : filteredInstances.length === 0 ? (
                                    <TableRow><TableCell colSpan={11} className={style.emptyState}>
                                        {visibleInstances.length === 0 ? 'Sin instancias' : 'No se encontraron instancias que coincidan con los filtros.'}
                                    </TableCell></TableRow>
                                ) : paginatedInstances.map((instance) => {
                                    const permissionLevel = instance.nivelAcceso ?? user?.permisos?.find((permission) => permission.vmid === instance.id)?.nivelAcceso;
                                    return (
                                        <TableRow key={instance.id} className="hover:bg-slate-50/70">
                                            <TableCell className={style.checkboxCell}><Checkbox aria-label={`Seleccionar ${instance.name}`} checked={(user?.instanciasPermitidas ?? []).includes(instance.id)} disabled /></TableCell>
                                            <TableCell className="p-4 table-text-secondary">{instance.id}</TableCell>
                                            <TableCell className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`size-9 rounded-full flex items-center justify-center ${instance.type === 'VM' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                        {instance.type === 'VM' ? <Monitor className="size-4" /> : <Container className="size-4" />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-destacado">{instance.name}</span>
                                                        {!isAdmin() && <Badge variant="outline" data-access-level={permissionLevel}>
                                                            {permissionLevel === 'READ_ONLY' ? 'Solo lectura' : permissionLevel === 'FULL_ACCESS' ? 'Control total' : 'Nivel de acceso no disponible'}
                                                        </Badge>}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-4"><InstanceTypeBadge type={instance.type} /></TableCell>
                                            <TableCell className="p-4"><InstanceStatusBadge status={instance.status} /></TableCell>
                                            <TableCell className="p-4 text-secundario">{instance.node}</TableCell>
                                            <TableCell className="p-4 table-text-secondary">{formatCpuUsage(instance.cpuUsage)}</TableCell>
                                            <TableCell className="p-4 table-text-secondary">{formatRamUsage(instance.ramUsage, instance.maxRam)}</TableCell>
                                            <TableCell className="p-4 table-text-secondary"><InstanceIpAddress ip={instance.ip} instanceName={instance.name} /></TableCell>
                                            <TableCell className="relative p-4 text-right">
                                                <div role="group" aria-label="Acciones">
                                                    <InstanceAction instance={instance} onActionAccepted={reloadInventory} />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>

                        <footer className={style.inventoryFooter}>
                            <div>
                                Mostrando <strong>{firstVisibleInstance} a {lastVisibleInstance}</strong> de <strong>{filteredInstances.length}</strong> instancias
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                    <span>10 por página</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        aria-label="Página anterior"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                        className="rounded border border-slate-200 bg-white p-1.5 text-slate-700 transition-colors hover:bg-slate-100 disabled:text-slate-400/50"
                                    >
                                        <ChevronLeft className="size-4" />
                                    </button>
                                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                                        <button
                                            key={page}
                                            type="button"
                                            aria-current={currentPage === page ? 'page' : undefined}
                                            onClick={() => setCurrentPage(page)}
                                            className={currentPage === page
                                                ? 'rounded border border-blue-600 bg-blue-600 px-3 py-1 font-medium text-white'
                                                : 'rounded px-3 py-1 text-slate-700 hover:bg-slate-100'}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        aria-label="Página siguiente"
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                        className="rounded border border-slate-200 bg-white p-1.5 text-slate-700 transition-colors hover:bg-slate-100 disabled:text-slate-400/50"
                                    >
                                        <ChevronRight className="size-4" />
                                    </button>
                                </div>
                            </div>
                        </footer>
                    </Card>
                </TabsContent>
            </Tabs>
        </section>
    );
}

const style = {
    page: 'flex min-w-0 flex-col gap-6 text-slate-900',
    header: 'flex flex-wrap items-start justify-between gap-5 pb-1',
    pageTitle: 'mb-2 text-[30px] font-semibold tracking-tight text-slate-900',
    description: 'text-sm leading-relaxed text-slate-500',
    headerActions: 'flex flex-wrap items-center gap-3',
    search: 'relative w-64 max-w-full',
    searchIcon: 'pointer-events-none absolute top-3 left-3 z-10 size-4 text-slate-500',
    searchInput: 'pl-10',
    smallIcon: 'size-4!',
    inventoryCard: 'min-w-0 gap-0 overflow-hidden rounded-xl border-slate-100 py-0 shadow-sm ring-0',
    inventoryToolbar: 'flex flex-wrap items-center justify-between gap-3',
    viewControls: 'flex items-center gap-1',
    activeView: 'border-green-700 text-green-700',
    table: 'min-w-[52rem] text-xs text-slate-700',
    tableHeading: 'header-of-table px-4',
    checkboxCell: 'w-12 p-4',
    emptyState: 'px-4 py-10 text-center text-sm text-slate-500',
    inventoryFooter: 'flex flex-col sm:flex-row items-center justify-between p-5 border-t border-slate-100 gap-4 text-xs text-secundario',
    pagination: 'flex items-center gap-2',
    currentPage: 'w-10 border-green-700 px-0 text-green-700',
};
