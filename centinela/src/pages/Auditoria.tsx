import { useState } from 'react';
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

export default function AuditoriaPage() {
    const [searchTerm, setSearchTerm] = useState('');

    // Datos mock alineados al diseño de auditoría
    const auditEvents = [
        {
            id: 1,
            fecha: '06/05/2024 18:04:21',
            usuario: 'AD Admin',
            accion: 'Inicio instancia',
            recurso: 'Ubuntu Server (101) VM',
            nodo: 'pve01',
            resultado: 'Exito',
            ip: '192.168.1.45',
        },
        {
            id: 2,
            fecha: '06/05/2024 17:58:03',
            usuario: 'AD Admin',
            accion: 'Tomo snapshot',
            recurso: 'Windows 11 (102) VM',
            nodo: 'pve01',
            resultado: 'Exito',
            ip: '192.168.1.45',
        },
        {
            id: 3,
            fecha: '08/05/2024 17:45:11',
            usuario: 'US usuario1',
            accion: 'Detuvo instancia',
            recurso: 'Debian 12 (103) VM',
            nodo: 'pve02',
            resultado: 'Exito',
            ip: '192.168.1.88',
        },
        {
            id: 4,
            fecha: '08/05/2024 17:30:45',
            usuario: 'AD Admin',
            accion: 'Actualizó configuración',
            recurso: 'Docker Host (201) CT',
            nodo: 'pve01',
            resultado: 'Exito',
            ip: '192.168.1.45',
        },
        {
            id: 5,
            fecha: '08/05/2024 17:25:12',
            usuario: 'usuario2',
            accion: 'Creó instancia',
            recurso: 'Home Assistant (202) CT',
            nodo: 'pve02',
            resultado: 'Exito',
            ip: '192.168.1.77',
        },
        {
            id: 6,
            fecha: '08/05/2024 17:10:09',
            usuario: 'AD Admin',
            accion: 'Eliminó backup',
            recurso: 'Ubuntu Server (101)',
            nodo: 'pve01',
            resultado: 'Advertencia',
            ip: '192.168.1.45',
        },
        {
            id: 7,
            fecha: '08/05/2024 16:55:33',
            usuario: 'usuario3',
            accion: 'Intento de inicio de sesión',
            recurso: 'Panel de control',
            nodo: '-',
            resultado: 'Fallido',
            ip: '192.168.1.200',
        },
        {
            id: 8,
            fecha: '06/05/2024 16:40:22',
            usuario: 'AD Admin',
            accion: 'Actualizó usuario',
            recurso: 'usuario2',
            nodo: '-',
            resultado: 'Exito',
            ip: '192.168.1.45',
        },
        {
            id: 9,
            fecha: '08/05/2024 16:22:18',
            usuario: 'US usuario1',
            accion: 'Eliminó instancia',
            recurso: 'Pi-hole (203) CT',
            nodo: 'pve02',
            resultado: 'Exito',
            ip: '192.168.1.88',
        },
    ];

    const filteredAuditEvents = auditEvents.filter((event) =>
        Object.values(event).some((value) =>
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const getResultBadge = (resultado: string) => {
        switch (resultado) {
            case 'Exito':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="size-3.5" /> Éxito
                    </span>
                );
            case 'Advertencia':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertTriangle className="size-3.5" /> Advertencia
                    </span>
                );
            case 'Fallido':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="size-3.5" /> Fallido
                    </span>
                );
            default:
                return null;
        }
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
                    <Button type="button" variant="outline"><Download className="size-4!" /> Exportar</Button>
                </div>
            </div>

            {/* Tarjetas de Métricas Superiores */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="flex flex-col justify-between rounded-xl border-slate-100 p-5 shadow-sm ring-0">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Eventos totales</span>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-metrica">126</span>
                        <span className="text-caption">En el período seleccionado</span>
                    </div>
                </Card>

                <Card className="flex flex-col justify-between rounded-xl border-slate-100 p-5 shadow-sm ring-0">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Exitosos</span>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-metrica text-emerald-600">78</span>
                        <span className="text-xs font-medium text-emerald-600">61.9% del total</span>
                    </div>
                </Card>

                <Card className="flex flex-col justify-between rounded-xl border-slate-100 p-5 shadow-sm ring-0">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Advertencias</span>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-metrica text-amber-600">8</span>
                        <span className="text-xs font-medium text-amber-600">6.3% del total</span>
                    </div>
                </Card>

                <Card className="flex flex-col justify-between rounded-xl border-slate-100 p-5 shadow-sm ring-0">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Fallidos</span>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-metrica text-rose-600">40</span>
                        <span className="text-xs font-medium text-rose-600">31.7% del total</span>
                    </div>
                </Card>
            </div>

            {/* Barra de Filtros y Acciones */}
            <Card className="flex flex-col items-center justify-between gap-4 rounded-xl border-slate-100 p-4 shadow-sm ring-0 md:flex-row">
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Rango de fechas */}
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-700">
                        <Calendar className="size-4 text-slate-500" />
                        <span>01/05/2024 - 08/05/2024</span>
                    </div>

                    {/* Selector de usuarios */}
                    <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-700">
                        Todos los usuarios
                    </div>

                    {/* Botón de filtros avanzados */}
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
                            {filteredAuditEvents.map((event) => (
                                <tr key={event.id} className="transition-colors hover:bg-slate-50/70">
                                    <td className="py-3 px-4 whitespace-nowrap text-secundario">{event.fecha}</td>
                                    <td className="py-3 px-4 font-medium text-slate-900">{event.usuario}</td>
                                    <td className="py-3 px-4">{event.accion}</td>
                                    <td className="py-3 px-4 text-secundario">{event.recurso}</td>
                                    <td className="py-3 px-4">
                                        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">
                                            {event.nodo}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">{getResultBadge(event.resultado)}</td>
                                    <td className="py-3 px-4 font-mono text-xs text-secundario">{event.ip}</td>
                                    <td className="py-3 px-4 text-right">
                                        <button aria-label={`Ver detalles de ${event.accion}`} className="inline-flex items-center justify-center rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
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
                        Mostrando <strong>1 a 9</strong> de <strong>126</strong> eventos
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <span>10 por página</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button disabled className="p-1.5 rounded border border-border bg-card text-muted-foreground/50 cursor-not-allowed">
                                <ChevronLeft className="size-4" />
                            </button>
                            <button aria-current="page" className="rounded border border-green-700 bg-green-700 px-3 py-1 font-medium text-white">1</button>
                            <button className="rounded px-3 py-1 text-slate-700 hover:bg-slate-100">2</button>
                            <button className="rounded px-3 py-1 text-slate-700 hover:bg-slate-100">3</button>
                            <span className="px-1 text-muted-foreground">...</span>
                            <button className="rounded px-3 py-1 text-slate-700 hover:bg-slate-100">14</button>
                            <button className="p-1.5 rounded border border-border bg-card hover:bg-muted text-foreground transition-colors">
                                <ChevronRight className="size-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Nota informativa inferior */}
            <div className="flex items-start gap-3 rounded-xl border border-green-100 bg-green-50/70 p-4 text-sm text-green-900">
                <div className="mt-0.5 font-semibold text-green-700">i</div>
                <div className="flex flex-col gap-0.5">
                    <span className="font-medium">Información sobre retención de registros</span>
                    <span className="text-xs text-green-800/80">La auditoría registra acciones críticas realizadas por los usuarios en el sistema. Los registros se conservan por 90 días.</span>
                </div>
            </div>
        </section>
    );
}