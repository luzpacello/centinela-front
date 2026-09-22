import { useState } from 'react';
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    Database,
    HardDrive,
    KeyRound,
    Laptop,
    LockKeyhole,
    Monitor,
    Save,
    ShieldCheck,
    Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import InformationOfUser from '@/components/features/users/components/informationOfUser';
import RolesAndPermissions from '@/components/features/users/components/rolesAndPermissions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const assignedInstances = [
    { name: 'Ubuntu Server (101)', type: 'VM', node: 'pve01', status: 'Activo', icon: Monitor },
    { name: 'Desarrollo (104)', type: 'LXC', node: 'pve01', status: 'Activo', icon: HardDrive },
    { name: 'Base de datos (108)', type: 'VM', node: 'pve01', status: 'Sin acceso', icon: Database },
];

const securityInformation = [
    { label: 'Autenticación 2FA', value: 'Activado', icon: ShieldCheck, highlighted: true },
    { label: 'Último cambio de contraseña', value: '02/05/2024, 09:10', icon: CalendarDays },
    { label: 'Intentos de inicio fallidos', value: '0', icon: KeyRound },
    { label: 'Bloqueado', value: 'No', icon: LockKeyhole },
];

const recentActivity = [
    { title: 'Inició sesión correctamente', time: 'Hoy, 17:41', address: '192.168.1.77', icon: ShieldCheck },
    { title: 'Inició instancia Windows 11 (102)', time: 'Hoy, 17:40', address: '192.168.1.77', icon: Laptop },
    { title: 'Tomó snapshot de Ubuntu Server (101)', time: 'Hoy, 16:22', address: '192.168.1.77', icon: HardDrive },
];

export default function DetailsUserPage() {
    const navigate = useNavigate();
    const goBack = () => navigate(-1);

    return (
        <section className={styles.pageContainer}>
            <header className={styles.pageHeader}>
                <div className={styles.headingContainer}>
                    <nav className={styles.breadcrumb} aria-label="Navegación secundaria">
                        <button type="button" className={styles.breadcrumbBackButton} onClick={goBack}>
                            Usuarios
                        </button>
                        <ChevronRight className={styles.breadcrumbIcon} aria-hidden="true" />
                        <span className={styles.currentUserName}>usuario2</span>
                    </nav>
                    <h1>Detalle / Edición de usuario</h1>
                    <p className="text-secundario">Gestioná la información, roles y permisos del usuario.</p>
                </div>

                <div className={styles.headerActions}>
                    <Button type="button" variant="outline" onClick={goBack}>
                        <ArrowLeft className={styles.actionIcon} aria-hidden="true" />
                        Volver
                    </Button>
                    <Button type="button" variant="outline" className={styles.deleteButton}>
                        <Trash2 className={styles.actionIcon} aria-hidden="true" />
                        Eliminar usuario
                    </Button>
                    <Button type="button">
                        <Save className={styles.actionIcon} aria-hidden="true" />
                        Guardar cambios
                    </Button>
                </div>
            </header>

            <div className={styles.contentGrid}>
                <main className={styles.mainColumn}>
                    <UserInformationTabs />
                </main>

                <aside className={styles.sidebarColumn}>
                    <UserSummaryCard />
                    <SecurityCard />
                    <RecentActivityCard />
                </aside>
            </div>
        </section>
    );
}

function UserInformationTabs() {
    const [activeTab, setActiveTab] = useState('general');

    return (
        <>
            <Card className={styles.tabsCard}>
                <Tabs value={activeTab} onValueChange={setActiveTab} className={styles.tabsContainer}>
                    <TabsList variant="line" className={styles.tabsList} aria-label="Información del usuario">
                        <TabsTrigger value="general">Información general</TabsTrigger>
                        <TabsTrigger value="roles">Roles y permisos</TabsTrigger>
                    </TabsList>
                    <TabsContent value="general" className={styles.generalInformationTabContent}>
                        <InformationOfUser />
                    </TabsContent>
                    <TabsContent value="roles" className={styles.rolesTabContent}>
                        <RolesAndPermissions />
                    </TabsContent>
                </Tabs>
            </Card>
            {activeTab === 'general' && <AssignedInstancesCard />}
        </>
    );
}

function AssignedInstancesCard() {
    return (
        <Card className={styles.assignedInstancesCard}>
            <div className={styles.cardHeaderWithAction}>
                <div>
                    <h4>Acceso a instancias asignadas</h4>
                    <p className="text-secundario">Definí a qué instancias puede acceder este usuario.</p>
                </div>
                <Button type="button" variant="outline">
                    <KeyRound className={styles.actionIcon} aria-hidden="true" />
                    Gestionar acceso
                </Button>
            </div>

            <Table className={styles.instancesTable}>
                <TableHeader>
                    <TableRow className="header-of-table">
                        <TableHead>Instancia</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Nodo</TableHead>
                        <TableHead>Estado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {assignedInstances.map(({ name, type, node, status, icon: InstanceIcon }) => (
                        <TableRow key={name} className={styles.tableBodyRow}>
                            <TableCell className={styles.instanceNameCell}>
                                <InstanceIcon className={styles.instanceIcon} aria-hidden="true" />
                                <p className="text-of-table">{name}</p>
                            </TableCell>
                            <TableCell>
                                <Badge className={type === 'LXC' ? styles.containerTypeBadge : styles.virtualMachineTypeBadge}>
                                    {type}
                                </Badge>
                            </TableCell>
                            <TableCell>{node}</TableCell>
                            <TableCell>
                                <span className={status === 'Activo' ? styles.activeStatus : styles.inactiveStatus}>
                                    <span className={status === 'Activo' ? styles.activeStatusDot : styles.inactiveStatusDot} />
                                    {status}
                                </span>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <div className={styles.accessNotice}>
                <LockKeyhole className={styles.noticeIcon} aria-hidden="true" />
                El acceso efectivo también puede estar limitado por el rol y los permisos del usuario.
            </div>
        </Card>
    );
}

function UserSummaryCard() {
    return (
        <Card className={styles.sidebarCard}>
            <h4>Resumen del usuario</h4>
            <div className={styles.userSummaryContent}>
                <div className={styles.userSummaryDetails}>
                    <div className={styles.userNameRow}>
                        <strong className="body">usuario2</strong>
                        <Badge className={styles.activeUserBadge}>
                            <span className={styles.activeUserBadgeDot} /> Activo
                        </Badge>
                    </div>
                    <Badge className={styles.standardUserBadge}>Usuario estándar</Badge>
                    <p className="text-secundario">usuario2@propex.local</p>
                    <p className="text-secundario">Creado el <strong>03/05/2024, 11:22</strong></p>
                </div>
            </div>
        </Card>
    );
}

function SecurityCard() {
    return (
        <Card className={styles.sidebarCard}>
            <h4>Seguridad</h4>
            <div className={styles.securityList}>
                {securityInformation.map(({ label, value, icon: SecurityIcon, highlighted }) => (
                    <div key={label} className={styles.securityRow}>
                        <span className={styles.securityLabel}>
                            <SecurityIcon className={styles.securityIcon} aria-hidden="true" />
                            {label}
                        </span>
                        <strong className={highlighted ? styles.enabledSecurityValue : styles.securityValue}>
                            {highlighted && <CheckCircle2 className={styles.enabledSecurityIcon} aria-hidden="true" />}
                            {value}
                        </strong>
                    </div>
                ))}
            </div>
        </Card>
    );
}

function RecentActivityCard() {
    return (
        <Card className={styles.activityCard}>
            <h4>Actividad reciente</h4>
            <div className={styles.activityList}>
                {recentActivity.map(({ title, time, address, icon: ActivityIcon }) => (
                    <div key={title} className={styles.activityRow}>
                        <span className={styles.activityIconContainer}>
                            <ActivityIcon className={styles.activityIcon} aria-hidden="true" />
                        </span>
                        <div className={styles.activityDetails}>
                            <p className="body">{title}</p>
                            <p className="text-secundario">{time}</p>
                        </div>
                        <Badge className={styles.addressBadge}>{address}</Badge>
                    </div>
                ))}
            </div>
            <button type="button" className={styles.allActivityButton}>
                Ver toda la actividad
                <ChevronRight className={styles.activityLinkIcon} aria-hidden="true" />
            </button>
        </Card>
    );
}

const styles = {
    pageContainer: 'flex min-w-0 flex-col gap-5 text-slate-900',
    pageHeader: 'flex flex-col items-start justify-between gap-5 lg:flex-row',
    headingContainer: 'min-w-0',
    breadcrumb: 'mb-3 flex items-center gap-1.5 text-xs text-slate-500',
    breadcrumbBackButton: 'rounded-sm transition-colors hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-emerald-600',
    breadcrumbIcon: 'size-3.5',
    currentUserName: 'font-semibold text-slate-900',
    headerActions: 'flex w-full flex-wrap gap-3 lg:w-auto lg:justify-end',
    deleteButton: 'border-red-300 bg-white font-medium text-red-600 hover:border-red-400 hover:bg-red-50',
    actionIcon: 'size-4!',
    contentGrid: 'grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_25rem]',
    mainColumn: 'flex min-w-0 flex-col gap-5',
    sidebarColumn: 'flex min-w-0 flex-col gap-5',
    tabsCard: 'gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white py-0 shadow-sm ring-0',
    tabsContainer: 'gap-0',
    tabsList: 'w-full rounded-none border-b border-slate-200',
    tabTrigger: 'min-w-fit flex-none px-2 pb-4 pt-2 text-xs font-medium data-active:text-emerald-700 after:bottom-0 data-active:after:bg-emerald-600 focus-visible:border-emerald-600 focus-visible:text-emerald-700 focus-visible:outline-emerald-600',
    generalInformationTabContent: 'bg-white',
    rolesTabContent: 'bg-white',
    assignedInstancesCard: 'gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white py-0 shadow-sm ring-0',
    cardHeaderWithAction: 'flex flex-col items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center',
    instancesTable: 'text-xs text-slate-700',
    tableBodyRow: 'hover:bg-slate-50/70',
    instanceNameCell: 'flex items-center gap-3 pl-5 font-medium text-slate-900',
    instanceIcon: 'size-4 text-slate-500',
    virtualMachineTypeBadge: 'rounded-md border-0 bg-blue-50 px-2 text-[11px] font-medium text-blue-700',
    containerTypeBadge: 'rounded-md border-0 bg-emerald-50 px-2 text-[11px] font-medium text-emerald-700',
    activeStatus: 'inline-flex items-center gap-2 font-medium text-slate-800',
    inactiveStatus: 'inline-flex items-center gap-2 text-slate-500',
    activeStatusDot: 'size-2 rounded-full bg-emerald-600',
    inactiveStatusDot: 'size-2 rounded-full bg-slate-400',
    accessNotice: 'mx-5 mb-4 mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-[11px] text-slate-500',
    noticeIcon: 'size-3.5 shrink-0',
    sidebarCard: 'gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm ring-0',
    sidebarCardTitle: 'mb-0 text-sm font-semibold text-slate-950',
    userSummaryContent: 'flex items-start gap-4',
    userAvatar: 'flex size-[72px] shrink-0 items-center justify-center rounded-full bg-blue-50 text-2xl font-semibold text-blue-600',
    userSummaryDetails: 'min-w-0 flex-1',
    userNameRow: 'mb-2 flex flex-wrap items-center gap-3',
    summaryUserName: 'text-base text-slate-950',
    activeUserBadge: 'border-0 bg-emerald-50 text-[11px] font-medium text-emerald-700',
    activeUserBadgeDot: 'size-2 rounded-full bg-emerald-600',
    standardUserBadge: 'rounded-md border-0 bg-blue-50 text-[11px] font-medium text-blue-700',
    securityList: 'flex flex-col gap-5',
    securityRow: 'flex items-center justify-between gap-4 text-xs',
    securityLabel: 'flex min-w-0 items-center gap-3 text-slate-600',
    securityIcon: 'size-4 shrink-0 text-slate-500',
    securityValue: 'shrink-0 font-medium text-slate-900',
    enabledSecurityValue: 'flex shrink-0 items-center gap-2 font-medium text-emerald-700',
    enabledSecurityIcon: 'size-4',
    activityCard: 'gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm ring-0',
    activityList: 'mt-1 divide-y divide-slate-100',
    activityRow: 'flex items-center gap-3 py-4',
    activityIconContainer: 'flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700',
    activityIcon: 'size-4',
    activityDetails: 'min-w-0 flex-1',
    addressBadge: 'hidden rounded-md border-0 bg-blue-50 text-[10px] font-medium text-blue-600 sm:inline-flex',
    allActivityButton: 'flex items-center gap-2 border-t border-slate-100 px-5 py-4 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50/50 hover:text-blue-700',
    activityLinkIcon: 'size-4',
};
