import { CirclePlay, Container, Monitor, Search, Square } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { InstanceStatusFilter, InstanceType } from '../types/instance';

export type { InstanceStatusFilter };

export interface InstanceFiltersBarProps {
    search: string;
    onSearchChange: (search: string) => void;
    statusFilter: InstanceStatusFilter;
    onStatusFilterChange: (status: InstanceStatusFilter) => void;
    typeFilter: 'all' | InstanceType;
    onTypeFilterChange: (type: 'all' | InstanceType) => void;
    totalCount: number;
    runningCount: number;
    stoppedCount: number;
    className?: string;
}

type InstanceStatusTabsProps = Pick<
    InstanceFiltersBarProps,
    'statusFilter' | 'onStatusFilterChange' | 'totalCount' | 'runningCount' | 'stoppedCount'
>;

export function InstanceStatusTabs({
    statusFilter,
    onStatusFilterChange,
    totalCount,
    runningCount,
    stoppedCount,
}: InstanceStatusTabsProps) {
    return (
        <Tabs
            value={statusFilter}
            onValueChange={(value) => {
                if (value === 'all' || value === 'running' || value === 'stopped') {
                    onStatusFilterChange(value);
                }
            }}
            className="w-auto min-w-0"
        >
            <TabsList variant="line" aria-label="Filtrar instancias por estado" className="max-w-full">
                <TabsTrigger value="all" className="px-4">
                    <Monitor aria-hidden="true" /> Instancias totales <Badge variant="secondary">{totalCount}</Badge>
                </TabsTrigger>
                <TabsTrigger value="running" className="px-4">
                    <CirclePlay aria-hidden="true" /> En ejecución <Badge variant="secondary">{runningCount}</Badge>
                </TabsTrigger>
                <TabsTrigger value="stopped" className="px-4">
                    <Square aria-hidden="true" /> Detenidas <Badge variant="secondary">{stoppedCount}</Badge>
                </TabsTrigger>
            </TabsList>
        </Tabs>
    );
}

interface InstanceSearchFiltersProps {
    search: string;
    onSearchChange: (search: string) => void;
    typeFilter: 'all' | InstanceType;
    onTypeFilterChange: (type: 'all' | InstanceType) => void;
}

export function InstanceSearchFilters({
    search,
    onSearchChange,
    typeFilter,
    onTypeFilterChange,
}: InstanceSearchFiltersProps) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64 max-w-full">
                <Search className="pointer-events-none absolute top-3 left-3 z-10 size-4 text-slate-500" aria-hidden="true" />
                <Input
                    className="pl-10"
                    placeholder="Buscar instancia..."
                    aria-label="Buscar por ID, nombre o IP"
                    value={search}
                    onChange={(event) => onSearchChange(event.target.value)}
                />
            </div>

            {/* Selector visible y accesible directo en la barra */}
            <div role="group" aria-label="Filtrar por tipo de recurso" className="inline-flex rounded-lg border border-slate-200 bg-slate-50/50 p-1">
                <Button
                    type="button"
                    size="sm"
                    variant={typeFilter === 'all' ? 'default' : 'ghost'}
                    aria-pressed={typeFilter === 'all'}
                    onClick={() => onTypeFilterChange('all')}
                    className="h-8 px-3 text-xs font-medium"
                >
                    Todas
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant={typeFilter === 'VM' ? 'default' : 'ghost'}
                    aria-pressed={typeFilter === 'VM'}
                    onClick={() => onTypeFilterChange('VM')}
                    className="h-8 gap-1.5 px-3 text-xs font-medium"
                >
                    <Monitor className="size-3.5" aria-hidden="true" /> VM
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant={typeFilter === 'LXC' ? 'default' : 'ghost'}
                    aria-pressed={typeFilter === 'LXC'}
                    onClick={() => onTypeFilterChange('LXC')}
                    className="h-8 gap-1.5 px-3 text-xs font-medium"
                >
                    <Container className="size-3.5" aria-hidden="true" /> LXC
                </Button>
            </div>
        </div>
    );
}

export function InstanceFiltersBar({
    search,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    typeFilter,
    onTypeFilterChange,
    totalCount,
    runningCount,
    stoppedCount,
    className = '',
}: InstanceFiltersBarProps) {
    return (
        <div className={`flex flex-wrap items-center justify-between gap-4 ${className}`.trim()}>
            <InstanceStatusTabs
                statusFilter={statusFilter}
                onStatusFilterChange={onStatusFilterChange}
                totalCount={totalCount}
                runningCount={runningCount}
                stoppedCount={stoppedCount}
            />
            <InstanceSearchFilters
                search={search}
                onSearchChange={onSearchChange}
                typeFilter={typeFilter}
                onTypeFilterChange={onTypeFilterChange}
            />
        </div>
    );
}

export default InstanceFiltersBar;