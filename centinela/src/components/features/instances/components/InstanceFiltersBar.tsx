import { Container, Filter, Monitor, Search, Server } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropDownMenu';
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
    vmCount: number;
    lxcCount: number;
    className?: string;
}

type InstanceTypeTabsProps = Pick<
    InstanceFiltersBarProps,
    'typeFilter' | 'onTypeFilterChange' | 'totalCount' | 'vmCount' | 'lxcCount'
>;

export function InstanceTypeTabs({
    typeFilter,
    onTypeFilterChange,
    totalCount,
    vmCount,
    lxcCount,
}: InstanceTypeTabsProps) {
    return (
        <Tabs
            value={typeFilter}
            onValueChange={(value) => {
                if (value === 'all' || value === 'VM' || value === 'LXC') {
                    onTypeFilterChange(value);
                }
            }}
            className="w-auto min-w-0"
        >
            <TabsList variant="line" aria-label="Filtrar instancias por tipo" className="max-w-full">
                <TabsTrigger value="all" className="px-4">
                    <Server aria-hidden="true" /> Instancias totales <Badge variant="secondary">{totalCount}</Badge>
                </TabsTrigger>
                <TabsTrigger value="VM" className="px-4">
                    <Monitor aria-hidden="true" /> Maquina virtual (VM) <Badge variant="secondary">{vmCount}</Badge>
                </TabsTrigger>
                <TabsTrigger value="LXC" className="px-4">
                    <Container aria-hidden="true" /> Contenedor (LXC) <Badge variant="secondary">{lxcCount}</Badge>
                </TabsTrigger>
            </TabsList>
        </Tabs>
    );
}

interface InstanceSearchFiltersProps {
    search: string;
    onSearchChange: (search: string) => void;
    statusFilter: InstanceStatusFilter;
    onStatusFilterChange: (status: InstanceStatusFilter) => void;
}

export function InstanceSearchFilters({
    search,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
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

            <DropdownMenu>
                <DropdownMenuTrigger>
                    <Filter className="size-4!" aria-hidden="true" /> Filtros
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[260px] max-w-[calc(100vw-2rem)]">
                    <DropdownMenuRadioGroup value={statusFilter} onValueChange={(value) => {
                        if (value === 'all' || value === 'running' || value === 'stopped') {
                            onStatusFilterChange(value);
                        }
                    }}>
                        <DropdownMenuLabel>Estados</DropdownMenuLabel>
                        <DropdownMenuRadioItem value="running">Encendidas</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="stopped">Detenidas</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="all">Todas las instancias</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
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
    vmCount,
    lxcCount,
    className = '',
}: InstanceFiltersBarProps) {
    return (
        <div className={`flex flex-wrap items-center justify-between gap-4 ${className}`.trim()}>
            <InstanceTypeTabs
                typeFilter={typeFilter}
                onTypeFilterChange={onTypeFilterChange}
                totalCount={totalCount}
                vmCount={vmCount}
                lxcCount={lxcCount}
            />
            <InstanceSearchFilters
                search={search}
                onSearchChange={onSearchChange}
                statusFilter={statusFilter}
                onStatusFilterChange={onStatusFilterChange}
            />
        </div>
    );
}

export default InstanceFiltersBar;
