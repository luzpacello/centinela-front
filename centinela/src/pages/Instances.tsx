import { ChevronLeft, ChevronRight, CirclePlay, Filter, LayoutGrid, List, Monitor, Plus, Search, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

export default function Instances() {
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
                        <Input className={style.searchInput} placeholder="Buscar instancia..." aria-label="Buscar instancia" readOnly />
                    </div>
                    <Button type="button" variant="outline"><Filter className={style.smallIcon} /> Filtros</Button>
                    <Button type="button"><Plus className={style.smallIcon} /> Crear instancia</Button>
                </div>
            </header>

            <div className={style.horizontalContent}>
                <Card className={style.summaryCard}>
                    <span className={style.greenIcon}><Monitor className={style.icon} /></span>
                    <div className={style.summaryContent}>
                        <p className="text-metrica">0</p>
                        <h2 className="text-caption">Instancias totales</h2>
                        <p className="text-caption">Todas las instancias en el sistema</p>
                    </div>
                </Card>
                <Card className={style.summaryCard}>
                    <span className={style.greenIcon}><CirclePlay className={style.icon} /></span>
                    <div className={style.summaryContent}>
                        <p className="text-metrica">0</p>
                        <h2 className="text-caption">En ejecución</h2>
                        <p className="text-caption">Instancias activas y funcionando</p>
                    </div>
                    <div className={style.chartPlaceholder}>Gráfica</div>
                </Card>
                <Card className={style.summaryCard}>
                    <span className={style.orangeIcon}><Square className={style.icon} /></span>
                    <div className={style.summaryContent}>
                        <p className="text-metrica">0</p>
                        <h2 className="text-caption">Detenidas</h2>
                        <p className="text-caption">Instancias apagadas</p>
                    </div>
                    <div className={style.chartPlaceholder}>Gráfica</div>
                </Card>
            </div>

            <Card className={style.inventoryCard}>
                <div className={style.inventoryToolbar}>
                    <div className={style.tabs}>
                        <Button type="button" variant="ghost" aria-pressed="true" className={style.activeTab}>Todas</Button>
                        <Button type="button" variant="ghost" aria-pressed="false" className={style.tab}>En ejecución</Button>
                        <Button type="button" variant="ghost" aria-pressed="false" className={style.tab}>Detenidas</Button>
                    </div>
                    <div className={style.viewControls}>
                        <Button type="button" variant="outline" size="icon" aria-label="Vista de lista" aria-pressed="true" className={style.activeView}>
                            <List className={style.smallIcon} />
                        </Button>
                        <Button type="button" variant="outline" size="icon" aria-label="Vista de tarjetas" aria-pressed="false">
                            <LayoutGrid className={style.smallIcon} />
                        </Button>
                    </div>
                </div>

                <div className={style.tableContainer}>
                    <table className={style.table} aria-label="Inventario de instancias">
                        <thead className={style.tableHead}>
                            <tr>
                                <th className={style.checkboxCell} scope="col"><Checkbox aria-label="Seleccionar todas las instancias" disabled /></th>
                                <th className={style.tableHeading} scope="col">Nombre</th>
                                <th className={style.tableHeading} scope="col">Tipo</th>
                                <th className={style.tableHeading} scope="col">Estado</th>
                                <th className={style.tableHeading} scope="col">Nodo</th>
                                <th className={style.tableHeading} scope="col">CPU</th>
                                <th className={style.tableHeading} scope="col">RAM</th>
                                <th className={style.tableHeading} scope="col">Almacenamiento</th>
                                <th className={style.tableHeading} scope="col">IP</th>
                                <th className={style.tableHeading} scope="col">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td colSpan={10} className={style.emptyState}>Sin instancias</td></tr>
                        </tbody>
                    </table>
                </div>

                <footer className={style.inventoryFooter}>
                    <p className={style.caption}>Mostrando 0 de 0 instancias</p>
                    <div className={style.pagination}>
                        <Button type="button" variant="outline" size="icon" aria-label="Página anterior" disabled><ChevronLeft className={style.smallIcon} /></Button>
                        <Button type="button" variant="outline" aria-current="page" className={style.currentPage}>1</Button>
                        <Button type="button" variant="outline" size="icon" aria-label="Página siguiente" disabled><ChevronRight className={style.smallIcon} /></Button>
                    </div>
                </footer>
            </Card>
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
    icon: 'size-6',
    primaryButton: 'bg-green-700! text-white hover:bg-green-800! hover:border-green-800!',
    horizontalContent: 'grid grid-cols-1 gap-4 xl:grid-cols-3',
    summaryCard: 'flex flex-row items-center gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm ring-0',
    summaryContent: 'min-w-0 flex-1',
    greenIcon: 'flex size-14 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700',
    orangeIcon: 'flex size-14 shrink-0 items-center justify-center rounded-full bg-orange-50 text-amber-500',
    metric: 'mb-1 text-[30px] font-semibold leading-tight text-slate-900',
    metricTitle: 'm-0 text-sm font-medium text-slate-700',
    caption: 'mt-1 text-xs leading-relaxed text-slate-500',
    chartPlaceholder: 'ml-auto flex min-h-14 w-12 shrink-0 items-center justify-center text-xs text-slate-400',
    inventoryCard: 'gap-0 overflow-hidden rounded-xl border border-slate-100 bg-white py-0 shadow-sm ring-0',
    inventoryToolbar: 'flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 pt-3',
    tabs: 'flex flex-wrap items-center gap-1',
    tab: 'h-12 rounded-none px-3 text-sm text-slate-600',
    activeTab: 'h-12 rounded-none border-b-2 border-b-green-700 px-3 text-sm font-medium text-green-700',
    viewControls: 'mb-3 flex items-center gap-1',
    activeView: 'border-green-700 text-green-700',
    tableContainer: 'w-full overflow-x-auto',
    table: 'w-full min-w-[900px] border-collapse text-left text-sm',
    tableHead: 'border-b border-slate-100 bg-slate-50/60 text-slate-700',
    tableHeading: 'px-4 py-4 text-xs font-medium whitespace-nowrap',
    checkboxCell: 'w-14 py-4 pr-2 pl-6',
    emptyState: 'h-[400px] text-center align-middle text-sm text-slate-400',
    inventoryFooter: 'flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4',
    pagination: 'flex items-center gap-2',
    currentPage: 'w-10 border-green-700 px-0 text-green-700',
};
