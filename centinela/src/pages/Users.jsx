import { ChevronDown, ChevronLeft, ChevronRight, Eye, Filter, Plus, Search, ShieldCheck, UserCog, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function Users() {
    return (
        <section className={style.page}>
            <header className={style.header}>
                <div>
                    <h1>Gestión de usuarios</h1>
                    <p className="text-secundario">Administrá los usuarios, roles y permisos del sistema.</p>
                </div>
                <div className={style.headerActions}>
                    <div className={style.search}>
                        <Search className={style.searchIcon} aria-hidden="true" />
                        <Input className={style.searchInput} placeholder="Buscar usuario..." aria-label="Buscar usuario" readOnly />
                    </div>
                    <Button type="button" variant="outline"><Filter className={style.smallIcon} /> Filtros</Button>
                    <Button type="button"><Plus className={style.smallIcon} /> Nuevo usuario <ChevronDown className={style.smallIcon} /></Button>
                </div>
            </header>

            <div className={style.summaryGrid}>
                <Card className={style.summaryCard}>
                    <span className={style.greenIcon}><UsersRound className={style.icon} /></span>
                    <div>
                        <p className="text-metrica">0</p>
                        <h2 className="text-caption">Usuarios totales</h2>
                        <p className="text-caption">En el sistema</p>
                    </div>
                </Card>
                <Card className={style.summaryCard}>
                    <span className={style.blueIcon}><ShieldCheck className={style.icon} /></span>
                    <div>
                        <p className="text-metrica">0</p>
                        <h2 className="text-caption">Administradores</h2>
                        <p className="text-caption">0% del total</p>
                    </div>
                </Card>
                <Card className={style.summaryCard}>
                    <span className={style.purpleIcon}><UserCog className={style.icon} /></span>
                    <div>
                        <p className="text-metrica">0</p>
                        <h2 className="text-caption">Usuarios estándar</h2>
                        <p className="text-caption">0% del total</p>
                    </div>
                </Card>
                <Card className={style.summaryCard}>
                    <span className={style.orangeIcon}><Eye className={style.icon} /></span>
                    <div>
                        <p className="text-metrica">0</p>
                        <h2 className="text-caption">Solo lectura</h2>
                        <p className="text-caption">0% del total</p>
                    </div>
                </Card>
            </div>

            <div className={style.contentGrid}>
                <Card className={style.usersCard}>
                    <div className={style.tabs}>
                        <Button type="button" variant="ghost" aria-pressed="true" className={style.activeTab}>Usuarios</Button>
                        <Button type="button" variant="ghost" aria-pressed="false" className={style.tab}>Roles y permisos</Button>
                    </div>

                    <div className={style.tableContainer}>
                        <table className={style.table} aria-label="Gestión de usuarios">
                            <thead className={style.tableHead}>
                                <tr>
                                    <th className={style.tableHeading} scope="col">Usuario</th>
                                    <th className={style.tableHeading} scope="col">Rol</th>
                                    <th className={style.tableHeading} scope="col">Estado</th>
                                    <th className={style.tableHeading} scope="col">Último acceso</th>
                                    <th className={style.tableHeading} scope="col">2FA</th>
                                    <th className={style.tableHeading} scope="col">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td colSpan={6} className={style.emptyState}>Sin usuarios</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <footer className={style.usersFooter}>
                        <p className={style.caption}>Mostrando 0 de 0 usuarios</p>
                        <div className={style.pagination}>
                            <Button type="button" variant="outline" size="icon" aria-label="Página anterior" disabled><ChevronLeft className={style.smallIcon} /></Button>
                            <Button type="button" variant="outline" aria-current="page" className={style.currentPage}>1</Button>
                            <Button type="button" variant="outline" size="icon" aria-label="Página siguiente" disabled><ChevronRight className={style.smallIcon} /></Button>
                        </div>
                    </footer>
                </Card>

                <Card className={style.detailCard}>
                    <p className={style.emptyDetail}>Sin usuario seleccionado</p>
                </Card>
            </div>
        </section>
    );
}

const style = {
    page: 'flex min-w-0 flex-col gap-6 text-slate-900',
    header: 'flex flex-wrap items-start justify-between gap-5 pb-1',
    headerActions: 'flex flex-wrap items-center gap-3',
    search: 'relative w-64 max-w-full',
    searchIcon: 'pointer-events-none absolute top-3 left-3 z-10 size-4 text-slate-500',
    searchInput: 'pl-10',
    smallIcon: 'size-4!',
    icon: 'size-6',
    summaryGrid: 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4',
    summaryCard: 'flex flex-row items-center gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm ring-0',
    greenIcon: 'flex size-14 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700',
    blueIcon: 'flex size-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600',
    purpleIcon: 'flex size-14 shrink-0 items-center justify-center rounded-full bg-purple-50 text-purple-600',
    orangeIcon: 'flex size-14 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-500',
    contentGrid: 'grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_19rem]',
    usersCard: 'gap-0 overflow-hidden rounded-xl border border-slate-100 bg-white py-0 shadow-sm ring-0',
    tabs: 'flex flex-wrap items-center gap-1 border-b border-slate-100 px-5 pt-3',
    tab: 'h-12 rounded-none px-3 text-sm text-slate-600',
    activeTab: 'h-12 rounded-none border-b-2 border-b-green-700 px-3 text-sm font-medium text-green-700',
    tableContainer: 'w-full overflow-x-auto',
    table: 'w-full min-w-[760px] border-collapse text-left text-sm',
    tableHead: 'border-b border-slate-100 bg-slate-50/60 text-slate-700',
    tableHeading: 'px-5 py-4 text-xs font-medium whitespace-nowrap',
    emptyState: 'h-[390px] text-center align-middle text-sm text-slate-400',
    usersFooter: 'flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4',
    caption: 'text-xs leading-relaxed text-slate-500',
    pagination: 'flex items-center gap-2',
    currentPage: 'w-10 border-green-700 px-0 text-green-700',
    detailCard: 'flex min-h-[510px] items-center justify-center rounded-xl border border-slate-100 bg-white p-5 shadow-sm ring-0',
    emptyDetail: 'text-center text-sm text-slate-400',
};
