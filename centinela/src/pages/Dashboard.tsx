import { ArrowRight, Bell, Box, ChevronDown, CirclePlay, Clock3, Cpu, Database, MemoryStick, Monitor, Plus, Server, ShieldCheck, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function Dashboard() {
    return (
        <section className={style.page}>
            <header className={style.header}>
                <div>
                    <h1> ¡Hola, Admin! </h1>
                    <p className="text-secundario"> Resumen general de tus instancias y recursos.</p>
                </div>
                <div className={style.headerActions}>
                    <div className={style.profile}>
                        <Button type="button">
                            <Plus className={style.smallIcon} /> Crear instancia
                        </Button>

                        <Button type="button" variant="ghost" size="icon" aria-label="Notificaciones">
                            <Bell className={style.smallIcon} />
                        </Button>

                    </div>

                </div>
            </header>

            <div className={style.horizontalContent}>
                <Card className={style.summaryCard}>
                    <div className={style.cardHeader}>
                        <span className={style.greenIcon}><Monitor className={style.icon} /></span>
                        <div>
                            <p className="text-metrica">0</p>
                            <h2 className="text-caption">Instancias totales</h2>
                        </div>
                    </div>
                    <Separator className="mt-5 mb-5" />
                    <div className={style.summaryFooter}>
                        <span className="text-caption"><span className={style.greenDot} />0 activas</span>
                        <span className="text-caption"><span className={style.grayDot} />0 detenidas</span>
                    </div>
                </Card>
                <Card className={style.summaryCard}>
                    <div className={style.cardHeader}>
                        <span className={style.greenIcon}><CirclePlay className={style.icon} /></span>
                        <div>
                            <p className="text-metrica">0</p>
                            <h2 className="text-caption">En ejecución</h2>
                        </div>
                    </div>
                    <Separator className="mt-5 mb-5" />
                    <p className="text-caption"><span className={style.greenText}>0%</span> del total</p>
                </Card>
                <Card className={style.summaryCard}>
                    <div className={style.cardHeader}>
                        <span className={style.orangeIcon}><Square className={style.icon} /></span>
                        <div>
                            <p className="text-metrica">0</p>
                            <h2 className="text-caption">Detenidas</h2>
                        </div>
                    </div>
                    <Separator className="mt-5 mb-5" />
                    <p className="text-caption"><span className={style.orangeText}>0%</span> del total</p>
                </Card>
                <Card className={style.summaryCard}>
                    <div className={style.cardHeader}>
                        <span className={style.purpleIcon}><Box className={style.icon} /></span>
                        <div>
                            <p className="text-metrica">0</p>
                            <h2 className="text-caption">Plantillas</h2>
                        </div>
                    </div>
                    <Separator className="mt-5 mb-5" />

                    <p className="text-caption">Disponibles para usar</p>
                </Card>
            </div>

            <Card className={style.resourceCard}>
                <div className={style.sectionHeader}>
                    <div className={style.sectionHeading}>
                        <h3>Uso total de recursos</h3>
                        <p className="text-secundario">De todas las instancias activas</p>
                    </div>
                    <Button type="button" variant="outline">
                        Última hora <ChevronDown className={style.smallIcon} />
                    </Button>
                </div>

                <div className={style.resources}>
                    <div className={style.resource}>
                        <span className={style.roundGreenIcon}><Cpu className={style.icon} /></span>
                        <div>
                            <h4>CPU</h4>
                            <p className="text-metrica">0%</p>
                            <p className="text-caption">0 de 0 núcleos</p>
                        </div>
                        <div className={style.chartPlaceholder}>Gráfica</div>
                    </div>

                    <div className={style.resource}>
                        <span className={style.roundBlueIcon}><MemoryStick className={style.icon} /></span>
                        <div>
                            <h4>Memoria RAM</h4>
                            <p className="text-metrica">0%</p>
                            <p className="text-caption">0 de 0 GB</p>
                        </div>
                        <div className={style.chartPlaceholder}>Gráfica</div>
                    </div>

                    <div className={style.resource}>
                        <span className={style.roundPurpleIcon}><Database className={style.icon} /></span>
                        <div>
                            <h4>Almacenamiento</h4>
                            <p className="text-metrica">0%</p>
                            <p className="text-caption">0 de 0 TB</p>
                        </div>
                        <div className={style.chartPlaceholder}>Gráfica</div>
                    </div>
                </div>
            </Card>

            <div className={style.details}>
                <Card className={style.detailCard}>
                    <div className={style.sectionHeader}>
                        <h4>Instancias recientes</h4>
                        <Button type="button" variant="ghost">Ver todas</Button>
                    </div>
                    <div className={style.emptyState}>Sin instancias</div>
                    <Button type="button" variant="outline" className={style.footerButton}>
                        Ver todas las instancias <ArrowRight className={style.smallIcon} />
                    </Button>
                </Card>

                <Card className={style.detailCard}>
                    <div className={style.sectionHeader}>
                        <h4>Actividad reciente</h4>
                        <Button type="button" variant="ghost">Ver todo</Button>
                    </div>
                    <div className={style.emptyState}>Sin novedades</div>
                    <Button type="button" variant="outline" className={style.footerButton}>
                        Ver toda la actividad <ArrowRight className={style.smallIcon} />
                    </Button>
                </Card>

                <Card className={style.detailCard}>
                    <div className={style.sectionHeader}>
                        <h4>Alertas y estado</h4>
                        <Button type="button" variant="ghost">Ver todas</Button>
                    </div>
                    <div className={style.emptyState}>Sin alertas</div>

                </Card>
            </div>

            <Card className={style.systemFooter}>
                <div className={style.systemStatus}>
                    <ShieldCheck className={style.systemIcon} />
                    <div><h2 className="text-destacado">Conexión del servidor</h2><p className="text-caption">Sin conexión</p></div>
                </div>
                <div className={style.systemStatus}>
                    <Clock3 className={style.systemIcon} />
                    <div><h2 className="text-destacado">Última sincronización</h2><p className="text-caption">Sin sincronizar</p></div>
                </div>
                <div className={style.systemStatus}>
                    <Server className={style.systemIcon} />
                    <div><h2 className="text-destacado">Sistema</h2><p className="text-caption">Sin información</p></div>
                </div>
            </Card>
        </section>
    );
}

const style = {
    page: 'flex min-w-0 flex-col gap-5 text-slate-900',
    header: 'flex flex-wrap items-start justify-between gap-4 pb-1',
    pageTitle: 'mb-2 text-[30px] font-semibold tracking-tight text-slate-900',
    description: 'text-sm leading-relaxed text-slate-500',
    headerActions: 'flex flex-col items-end gap-3',
    profile: 'flex items-center gap-4 text-slate-600',
    avatar: 'flex size-9 items-center justify-center rounded-full bg-green-800 text-base font-medium text-white',
    primaryButton: 'bg-green-700! text-white hover:bg-green-800! hover:border-green-800!',
    horizontalContent: 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4',
    summaryCard: 'gap-0 rounded-xl border border-slate-100 bg-white p-5 shadow-sm ring-0',
    cardHeader: 'flex items-center gap-5',
    icon: 'size-6',
    smallIcon: 'size-4!',
    greenIcon: 'flex size-14 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-800',
    orangeIcon: 'flex size-14 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600',
    purpleIcon: 'flex size-14 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600',
    metric: 'my-1 text-[28px] font-semibold leading-tight text-slate-900',
    metricTitle: 'm-0 text-sm font-normal text-slate-600',
    summaryFooter: 'flex items-end gap-2 ',
    status: 'mr-3 inline-flex items-center gap-2',
    greenDot: 'size-2 rounded-full bg-green-700',
    grayDot: 'size-2 rounded-full bg-slate-400',
    greenText: 'font-medium text-green-700',
    orangeText: 'font-medium text-orange-600',
    resourceCard: 'rounded-xl border border-slate-100 bg-white p-5 shadow-sm ring-0',
    sectionHeader: 'flex flex-wrap items-center justify-between gap-2',
    sectionHeading: 'flex flex-wrap items-center gap-x-4 gap-y-1',
    sectionTitle: 'm-0 text-sm font-semibold text-slate-900',
    resources: 'mt-5 grid grid-cols-1 divide-y divide-slate-100 xl:grid-cols-3 xl:divide-x xl:divide-y-0',
    resource: 'flex min-w-0 flex-wrap items-center gap-4 px-4 py-3',
    resourceTitle: 'mb-2 text-sm font-normal text-slate-900',
    roundGreenIcon: 'flex size-14 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-800',
    roundBlueIcon: 'flex size-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600',
    roundPurpleIcon: 'flex size-14 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600',
    chartPlaceholder: 'flex h-20 min-w-16 flex-1 items-center justify-center text-xs text-slate-400',
    details: 'grid grid-cols-1 gap-4 xl:grid-cols-3',
    detailCard: 'flex min-h-[340px] flex-col gap-3 rounded-xl border border-slate-100 bg-white p-5 shadow-sm ring-0',
    textButton: 'h-8 px-1 text-xs text-slate-500',
    emptyState: 'flex min-h-28 flex-1 items-center justify-center text-sm text-slate-400',
    footerButton: 'w-full justify-between text-xs text-blue-600',
    quickActions: 'flex flex-col gap-2 border-t border-slate-100 pt-4',
    quickAction: 'h-8 w-full justify-start gap-2 px-3 text-xs',
    trailingIcon: 'ml-auto size-4!',
    systemFooter: 'grid grid-cols-1 gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm ring-0 md:grid-cols-3 md:divide-x md:divide-slate-100',
    systemStatus: 'flex items-center gap-4 px-3',
    systemIcon: 'size-6 shrink-0 text-slate-500',
    systemTitle: 'm-0 text-xs font-medium text-slate-900',
    caption: 'mt-1 text-xs text-slate-500',
};
