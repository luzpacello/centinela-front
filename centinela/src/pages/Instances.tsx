import { useMemo, useState } from 'react';
import { Container, Monitor, Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useInstances } from '@/components/features/instances/hooks/useInstances';
import InstanceAction from '@/components/features/instances/components/InstanceAction';
import { InstanceTypeBadge, InstanceStatusBadge } from '@/components/features/instances/components/InstanceBadges';
import { InstanceIpAddress } from '@/components/features/instances/components/InstanceIpAddress';
import { formatCpuUsage, formatRamUsage } from '@/components/features/instances/utils/formatInstanceTelemetry';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import InstanceFiltersBar, { type InstanceStatusFilter } from '@/components/features/instances/components/InstanceFiltersBar';
import type { InstanceType } from '@/components/features/instances/types/instance';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';

const INSTANCES_PER_PAGE = 10;

export default function Instances() {
    const navigate = useNavigate();
    const { user, isAdmin, canAccessInstance } = useAuth();
    const { instances, isLoading, errorMessage, reloadInventory, pendingPowerActions, markPowerActionAccepted, transitioningTasks } = useInstances();
    const visibleInstances = useMemo(
        () => instances.filter((instance) => canAccessInstance(instance.id)),
        [instances, canAccessInstance],
    );
    const runningInstanceCount = visibleInstances.filter((instance) => instance.status === 'running').length;
    const stoppedInstanceCount = visibleInstances.filter((instance) => instance.status === 'stopped' || instance.status === 'paused').length;
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<InstanceStatusFilter>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | InstanceType>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const filteredInstances = useMemo(() => {
        const normalizedSearch = search.trim().toLocaleLowerCase('es');

        return visibleInstances.filter((instance) => {
            const matchesText = instance.name.toLocaleLowerCase('es').includes(normalizedSearch)
                || String(instance.id).includes(normalizedSearch);
            const matchesType = typeFilter === 'all' || instance.type === typeFilter;
            const matchesStatus = statusFilter === 'all'
                || (statusFilter === 'running' && instance.status === 'running')
                || (statusFilter === 'stopped' && (instance.status === 'stopped' || instance.status === 'paused'));

            return matchesText && matchesType && matchesStatus;
        });
    }, [visibleInstances, search, typeFilter, statusFilter]);
    const resetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setTypeFilter('all');
        setCurrentPage(1);
    };
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
                {isAdmin() && <Button type="button" onClick={() => navigate('/instances/new')}><Plus className={style.smallIcon} /> Crear instancia</Button>}
            </header>

            <InstanceFiltersBar
                search={search}
                onSearchChange={(value) => {
                    setSearch(value);
                    setCurrentPage(1);
                }}
                statusFilter={statusFilter}
                onStatusFilterChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                }}
                typeFilter={typeFilter}
                onTypeFilterChange={(value) => {
                    setTypeFilter(value);
                    setCurrentPage(1);
                }}
                totalCount={visibleInstances.length}
                runningCount={runningInstanceCount}
                stoppedCount={stoppedInstanceCount}
            />

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
                                {visibleInstances.length === 0 ? 'Sin instancias' : (
                                    <div className="flex flex-col items-center gap-3">
                                        <p>No se encontraron instancias que coincidan con los filtros aplicados</p>
                                        <Button type="button" variant="outline" onClick={resetFilters}>Restablecer filtros</Button>
                                    </div>
                                )}
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
                                    <TableCell className="p-4"><InstanceStatusBadge status={instance.status} activeTask={instance.activeTask} pendingAction={pendingPowerActions[instance.id]?.action} /></TableCell>
                                    <TableCell className="p-4 text-secundario">{instance.node}</TableCell>
                                    <TableCell className="p-4 table-text-secondary">{formatCpuUsage(instance.cpuUsage)}</TableCell>
                                    <TableCell className="p-4 table-text-secondary">{formatRamUsage(instance.ramUsage, instance.maxRam)}</TableCell>
                                    <TableCell className="p-4 table-text-secondary"><InstanceIpAddress ip={instance.ip} instanceName={instance.name} /></TableCell>
                                    <TableCell className="relative p-4 text-right">
                                        <div role="group" aria-label="Acciones">
                                            <InstanceAction
                                                instance={instance}
                                                transition={transitioningTasks[instance.id] ?? null}
                                                isPowerActionPending={Boolean(pendingPowerActions[instance.id])}
                                                onActionAccepted={(action) => markPowerActionAccepted(instance.id, action)}
                                                onDeleteAccepted={reloadInventory}
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>

                <footer className={style.inventoryFooter}>
                    <div>
                        Mostrando <strong>{filteredInstances.length}</strong> de <strong>{visibleInstances.length}</strong> instancias
                        <span className="ml-2">({firstVisibleInstance} a {lastVisibleInstance} en esta página)</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <span>10 por página</span>
                        <Pagination className="mx-0 w-auto justify-end">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        href="#"
                                        aria-disabled={currentPage === 1}
                                        tabIndex={currentPage === 1 ? -1 : 0}
                                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : undefined}
                                        onClick={(event) => {
                                            event.preventDefault();
                                            setCurrentPage((page) => Math.max(1, page - 1));
                                        }}
                                    />
                                </PaginationItem>
                                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                                    <PaginationItem key={page}>
                                        <PaginationLink
                                            href="#"
                                            size="icon"
                                            isActive={currentPage === page}
                                            aria-label={`Página ${page}`}
                                            onClick={(event) => {
                                                event.preventDefault();
                                                setCurrentPage(page);
                                            }}
                                        >
                                            {page}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}
                                <PaginationItem>
                                    <PaginationNext
                                        href="#"
                                        aria-disabled={currentPage === totalPages}
                                        tabIndex={currentPage === totalPages ? -1 : 0}
                                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : undefined}
                                        onClick={(event) => {
                                            event.preventDefault();
                                            setCurrentPage((page) => Math.min(totalPages, page + 1));
                                        }}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                </footer>
            </Card>
        </section>
    );
}

const style = {
    page: 'flex min-w-0 flex-col gap-6 text-slate-900',
    header: 'flex flex-wrap items-start justify-between gap-5 pb-1',
    smallIcon: 'size-4!',
    inventoryCard: 'min-w-0 gap-0 overflow-hidden rounded-xl border-slate-100 py-0 shadow-sm ring-0',
    table: 'min-w-[52rem] text-xs text-slate-700',
    tableHeading: 'header-of-table px-4',
    checkboxCell: 'w-12 p-4',
    emptyState: 'px-4 py-10 text-center text-sm text-slate-500',
    inventoryFooter: 'flex flex-col sm:flex-row items-center justify-between p-5 border-t border-slate-100 gap-4 text-xs text-secundario',
};
