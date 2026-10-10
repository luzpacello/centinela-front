import { CirclePlay, Container, Filter, Monitor, Search, Square } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropDownMenu';
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

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-64 max-w-full">
                    <Search className="pointer-events-none absolute top-3 left-3 z-10 size-4 text-slate-500" aria-hidden="true" />
                    <Input
                        className="pl-10"
                        placeholder="Buscar instancia..."
                        aria-label="Buscar por ID o nombre"
                        value={search}
                        onChange={(event) => onSearchChange(event.target.value)}
                    />
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger aria-label="Filtrar por tipo de instancia">
                        <Filter className="size-4!" aria-hidden="true" /> {typeFilter === 'all' ? 'Filtros' : `Filtros: ${typeFilter}`}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuRadioGroup
                            value={typeFilter}
                            onValueChange={(value) => {
                                if (value === 'all' || value === 'VM' || value === 'LXC') {
                                    onTypeFilterChange(value);
                                }
                            }}
                        >
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
            </div>
        </div>
    );
}

export default InstanceFiltersBar;
