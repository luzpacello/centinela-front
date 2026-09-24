import { ConfirmUserAction } from '@/components/common/ConfirmUserAction';
import { deactivateUserAccount } from '@/components/features/users/services/userDeactivationService';
import { useUserInstanceAccess } from '@/components/features/users/hooks/useUserInstanceAccess';
import { useRef, useState } from 'react';
import { updateUserDetails } from '@/components/features/users/services/userDetailsService';
import { ApiRequestError } from '@/services/apiClient';
import { toast } from '@/components/ui/toast';
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    ChevronRight,
    HardDrive,
    KeyRound,
    Laptop,
    Loader2,
    LockKeyhole,
    Monitor,
    Save,
    ShieldCheck,
    Trash2,
} from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router';
import InformationOfUser from '@/components/features/users/components/informationOfUser';
import RolesAndPermissions from '@/components/features/users/components/rolesAndPermissions';
import { useEditableUser } from '@/components/features/users/hooks/useEditableUser';
import { useUserDetails } from '@/components/features/users/hooks/useUserDetails';
import type {
    EditableUserValues,
    UpdateEditableUserField,
    UserDetails,
    UserDetailsNavigationState,
} from '@/components/features/users/types/user';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const additionalSecurityInformation = [
    { label: 'Último cambio de contraseña', value: '02/05/2024, 09:10', icon: CalendarDays, highlighted: false },
    { label: 'Intentos de inicio fallidos', value: '0', icon: KeyRound, highlighted: false },
    { label: 'Bloqueado', value: 'No', icon: LockKeyhole, highlighted: false },
];

const recentActivity = [
    { title: 'Inició sesión correctamente', time: 'Hoy, 17:41', address: '192.168.1.77', icon: ShieldCheck },
    { title: 'Inició instancia Windows 11 (102)', time: 'Hoy, 17:40', address: '192.168.1.77', icon: Laptop },
    { title: 'Tomó snapshot de Ubuntu Server (101)', time: 'Hoy, 16:22', address: '192.168.1.77', icon: HardDrive },
];

export default function DetailsUserPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { userId } = useParams();
    const navigationState = location.state as UserDetailsNavigationState | null;
    const { user, isLoading, errorMessage, retry } = useUserDetails(
        userId,
        navigationState?.isCurrentUser === true,
    );
    const goBack = () => navigate(-1);

    if (isLoading) {
        return (
            <section className={styles.pageContainer} aria-busy="true" aria-live="polite">
                <div className="flex min-h-80 items-center justify-center gap-3 text-slate-500">
                    <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                    <span>Cargando usuario…</span>
                </div>
            </section>
        );
    }

    if (!user || errorMessage) {
        return (
            <section className={styles.pageContainer}>
                <div className="flex min-h-80 flex-col items-center justify-center gap-4 text-center">
                    <p role="alert" className="text-sm text-red-600">{errorMessage ?? 'No se pudo cargar el usuario.'}</p>
                    <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={goBack}>Volver</Button>
                        {userId && <Button type="button" onClick={retry}>Reintentar</Button>}
                    </div>
                </div>
            </section>
        );
    }

    return <DetailsUserContent key={user.id} user={user} goBack={goBack} />;
}

function DetailsUserContent({ user, goBack }: { user: UserDetails; goBack: () => void }) {
    const navigate = useNavigate();
    const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
    async function confirmUserDeletion() {
        await deactivateUserAccount(user.id);
        toast.add({ title: 'Usuario eliminado', description: 'La cuenta fue desactivada y sus sesiones fueron invalidadas.', type: 'success' });

    }
    const [confirmedUser, setConfirmedUser] = useState(user);
    const { values, updateField, reset } = useEditableUser(confirmedUser);
    const instanceAccess = useUserInstanceAccess(confirmedUser);
    const [isSaving, setIsSaving] = useState(false);
    const [emailError, setEmailError] = useState<string | undefined>();
    const saveInProgress = useRef(false);
    const profileChanges: Partial<Pick<UserDetails, 'nombreCompleto' | 'emailUsuario' | 'rol' | 'activo'>> = {};
    if (values.nombreCompleto !== confirmedUser.nombreCompleto) profileChanges.nombreCompleto = values.nombreCompleto;
    if (values.emailUsuario !== confirmedUser.emailUsuario) profileChanges.emailUsuario = values.emailUsuario;
    if (values.rol !== confirmedUser.rol) profileChanges.rol = values.rol;
    if (values.activo !== confirmedUser.activo) profileChanges.activo = values.activo;
    const hasProfileChanges = Object.keys(profileChanges).length > 0;
    const hasPermissionChanges = Object.keys(instanceAccess.pendingAccess).length > 0;

    const handleFieldChange: UpdateEditableUserField = (field, value) => {
        if (saveInProgress.current) return;
        if (field === 'emailUsuario') setEmailError(undefined);
        updateField(field, value);
    };

    async function handleSaveChanges() {
        if (saveInProgress.current || (!hasProfileChanges && !hasPermissionChanges)) return;
        saveInProgress.current = true;
        setIsSaving(true);
        setEmailError(undefined);
        let profileWasSaved = false;
        try {
            if (hasProfileChanges) {
                const savedUser = await updateUserDetails(user.id, profileChanges);
                setConfirmedUser(savedUser);
                reset(savedUser);
                profileWasSaved = true;
            }
            if (hasPermissionChanges) await instanceAccess.saveAssignments({ notify: false });
            toast.add({ title: 'Cambios guardados', description: 'Los cambios del usuario se guardaron correctamente.', type: 'success' });
        } catch (error) {
            if (error instanceof ApiRequestError && error.status === 409 && !profileWasSaved) {
                setEmailError('El correo ingresado ya pertenece a otro usuario.');
            }
            // Los errores 401/403 ya se muestran en ApiResponseNotifier.
            if (!(error instanceof ApiRequestError && [401, 403].includes(error.status))) {
                toast.add({
                    title: profileWasSaved ? 'Perfil guardado; permisos pendientes' : 'No se pudieron guardar todos los cambios',
                    description: error instanceof Error ? error.message : 'Intentá nuevamente.',
                    type: 'error',
                });
            }
        } finally {
            saveInProgress.current = false;
            setIsSaving(false);
        }
    }

    return (
        <section className={styles.pageContainer}>
            {isDeleteConfirmationOpen && <ConfirmUserAction variant="destructive" onCompleted={() => { setIsDeleteConfirmationOpen(false); navigate('/users', { replace: true }); }} title="Eliminar usuario" description={`Se dará de baja la cuenta de ${confirmedUser.nombreUsuario} y se invalidarán todas sus sesiones activas. La cuenta no se borrará físicamente.`} onConfirm={confirmUserDeletion} onCancel={() => setIsDeleteConfirmationOpen(false)} />}
            <header className={styles.pageHeader}>
                <div className={styles.headingContainer}>
                    <nav className={styles.breadcrumb} aria-label="Navegación secundaria">
                        <button type="button" className={styles.breadcrumbBackButton} onClick={goBack}>
                            Usuarios
                        </button>
                        <ChevronRight className={styles.breadcrumbIcon} aria-hidden="true" />
                        <span className={styles.currentUserName}>{user.nombreUsuario}</span>
                    </nav>
                    <h1>Edición de usuario</h1>
                    <p className="text-secundario">Gestioná la información, roles y permisos del usuario.</p>
                </div>

                <div className={styles.headerActions}>
                    <Button type="button" variant="outline" onClick={goBack}>
                        <ArrowLeft className={styles.actionIcon} aria-hidden="true" />
                        Volver
                    </Button>
                    <Button type="button" variant="outline" className={styles.deleteButton} disabled={isSaving} onClick={() => setIsDeleteConfirmationOpen(true)}>
                        <Trash2 className={styles.actionIcon} aria-hidden="true" />
                        Eliminar usuario
                    </Button>
                    <Button type="button" onClick={() => void handleSaveChanges()} disabled={isSaving || (!hasProfileChanges && !hasPermissionChanges) || (hasPermissionChanges && instanceAccess.isLoading)} aria-busy={isSaving}>
                        <Save className={styles.actionIcon} aria-hidden="true" />
                        Guardar cambios
                    </Button>
                </div>
            </header>

            <div className={styles.contentGrid}>
                <main className={styles.mainColumn} inert={isSaving} aria-busy={isSaving}>
                    <UserInformationTabs instanceAccess={instanceAccess} values={values} onFieldChange={handleFieldChange} emailError={emailError} />
                </main>

                <aside className={styles.sidebarColumn}>
                    <UserSummaryCard user={confirmedUser} values={confirmedUser} />
                    <SecurityCard user={user} />
                    <RecentActivityCard />
                </aside>
            </div>
        </section>
    );
}

function UserInformationTabs({
    instanceAccess,
    values,
    onFieldChange,
    emailError,
}: {
    instanceAccess: ReturnType<typeof useUserInstanceAccess>;
    values: EditableUserValues;
    onFieldChange: UpdateEditableUserField;
    emailError?: string;
}) {
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
                        <InformationOfUser values={values} onFieldChange={onFieldChange} emailError={emailError} />
                    </TabsContent>
                    <TabsContent value="roles" className={styles.rolesTabContent}>
                        <RolesAndPermissions
                            instanceAccess={instanceAccess}
                            pendingAccess={instanceAccess.pendingAccess}
                            role={values.rol}
                            onRoleChange={(role) => onFieldChange('rol', role)}
                        />
                    </TabsContent>
                </Tabs>
            </Card>
            {activeTab === 'general' && <AssignedInstancesCard instanceIds={instanceAccess.assignedIds} />}
        </>
    );
}

function AssignedInstancesCard({ instanceIds }: { instanceIds: Array<string | number> }) {
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
                    {instanceIds.map((instanceId) => (
                        <TableRow key={instanceId} className={styles.tableBodyRow}>
                            <TableCell className={styles.instanceNameCell}>
                                <Monitor className={styles.instanceIcon} aria-hidden="true" />
                                <p className="text-of-table">Instancia ({instanceId})</p>
                            </TableCell>
                            <TableCell>—</TableCell>
                            <TableCell>—</TableCell>
                            <TableCell>
                                <span className={styles.activeStatus}>
                                    <span className={styles.activeStatusDot} />
                                    Activo
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

function UserSummaryCard({ user, values }: { user: UserDetails; values: EditableUserValues }) {
    const isActive = values.activo;

    return (
        <Card className={styles.sidebarCard}>
            <h4>Resumen del usuario</h4>
            <div className={styles.userSummaryContent}>
                <div className={styles.userSummaryDetails}>
                    <div className={styles.userNameRow}>
                        <strong className="body">{user.nombreUsuario}</strong>
                        <Badge className={isActive ? styles.activeUserBadge : styles.inactiveUserBadge}>
                            <span className={isActive ? styles.activeUserBadgeDot : styles.inactiveUserBadgeDot} />
                            {isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                    </div>
                    <Badge className={styles.standardUserBadge}>{formatRole(values.rol)}</Badge>
                    <p className="text-secundario">{values.emailUsuario}</p>
                    <p className="text-secundario">Creado el <strong>{formatDateTime(user.fechaCreacion)}</strong></p>
                </div>
            </div>
        </Card>
    );
}

function SecurityCard({ user }: { user: UserDetails }) {
    const securityInformation = [
        {
            label: 'Autenticación 2FA',
            value: user.totpVinculado ? 'Activado' : 'Desactivado',
            icon: ShieldCheck,
            highlighted: user.totpVinculado,
        },
        ...additionalSecurityInformation,
    ];

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

function formatRole(role: string): string {
    if (role === 'ADMIN') return 'Administrador';
    if (role === 'OPERATOR') return 'Operador';
    if (role === 'READ_ONLY') return 'Solo lectura';
    return role;
}

function formatDateTime(value: string | null): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
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
    inactiveUserBadge: 'border-0 bg-slate-100 text-[11px] font-medium text-slate-600',
    inactiveUserBadgeDot: 'size-2 rounded-full bg-slate-400',
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
