import { ConfirmUserAction } from '@/components/common/ConfirmUserAction';
import { useDeletedUsers } from '@/components/features/users/hooks/useDeletedUsers';
import { deleteUserAccount } from '@/components/features/users/services/userDeactivationService';
import { updateUserDetails } from '@/components/features/users/services/userDetailsService';
import { userDeletionMessage, userSuspensionMessage, userReactivationMessage } from '@/components/features/users/utils/userAccountMessages';
import { toast } from '@/components/ui/toast';
import { useEffect, useState } from 'react';
import {
    Search,
    Filter,
    UserPlus,
    Shield,
    CheckCircle2,
    XCircle,
    MoreVertical,
    Key,
    UserX,
    Trash2,
    Edit3,
    QrCode,
    UserRound,
    UsersRound,
    Calendar,
    UserKey
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropDownMenu';
import { ApiRequestError, apiClient } from '@/services/apiClient';
import { useNavigate } from 'react-router';
import type { UserDetailsNavigationState } from '@/components/features/users/types/user';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';

// Contrato real de GET /api/admin/users (UsuarioResumenDTO y su resumen).
interface UsuarioResumenDTO {
    id: string | number;
    nombreCompleto?: string | null;
    nombreUsuario?: string | null;
    emailUsuario?: string | null;
    rol?: string | null;
    activo?: boolean;
    eliminadoEn?: string | null;
    totpVinculado?: boolean;
    fechaUltimoAcceso?: string | null;
    fechaCreacion?: string | null;
    esUsuarioActual?: boolean;
}

interface ResumenUsuarios {
    summary?: { total?: number; admins?: number; operators?: number };
    users?: UsuarioResumenDTO[];
}

interface UserRow {
    id: string | number;
    name: string;
    email: string;
    role: string;
    roleType: string;
    status: string;
    eliminadoEn: string | null;
    lastAccess: string;
    lastAccessRaw: string | null;
    twoFactor: string;
    avatarBg: string;
    isCurrentUser: boolean;
}

const EMPTY_TEXT = '—';
const USERS_PER_PAGE = 10;

function displayText(value?: string | null): string {
    const text = typeof value === 'string' ? value.trim() : '';
    return text || EMPTY_TEXT;
}

function formatLastAccess(value?: string | null): string {
    if (!value) return EMPTY_TEXT;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return EMPTY_TEXT;
    return date.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function toUserRow(dto: UsuarioResumenDTO): UserRow {
    const esAdmin = dto.rol === 'ADMIN';
    return {
        id: dto.id,
        name: displayText(dto.nombreCompleto),
        email: displayText(dto.emailUsuario),
        role: displayText(dto.rol),
        roleType: esAdmin ? 'Admin' : 'US',
        status: dto.eliminadoEn != null ? 'Eliminado' : dto.activo ? 'Activo' : 'Inactivo',
        eliminadoEn: dto.eliminadoEn ?? null,
        lastAccess: formatLastAccess(dto.fechaUltimoAcceso),
        lastAccessRaw: dto.fechaUltimoAcceso ?? null,
        twoFactor: dto.totpVinculado ? 'Activado' : 'Desactivado',
        avatarBg: esAdmin ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800',
        isCurrentUser: dto.esUsuarioActual === true,
    };
}

export default function UsersPage() {
    const navigate = useNavigate();
    const [userFilter, setUserFilter] = useState<'all' | 'ADMIN' | 'OPERATOR' | 'deleted'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [twoFactorFilter, setTwoFactorFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
    const [lastAccessFrom, setLastAccessFrom] = useState('');
    const [lastAccessTo, setLastAccessTo] = useState('');
    const [openDropdownId, setOpenDropdownId] = useState<string | number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [users, setUsers] = useState<UserRow[]>([]);
    const [summary, setSummary] = useState({ total: 0, admins: 0, operators: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [pendingAccountAction, setPendingAccountAction] = useState<{ user: UserRow; action: 'delete' | 'deactivate' | 'reactivate' } | null>(null);
    const [pendingAdminAction, setPendingAdminAction] = useState<{
        user: UserRow;
        action: 'reset-password' | 'reset-2fa';
    } | null>(null);
    const [listRefreshVersion, setListRefreshVersion] = useState(0);
    const deletedUsersState = useDeletedUsers(true, listRefreshVersion);
    async function confirmAccountAction() {
        if (!pendingAccountAction || pendingAccountAction.user.eliminadoEn != null) return;
        const { user, action } = pendingAccountAction;
        if (action === 'delete') await deleteUserAccount(String(user.id));
        else await updateUserDetails(String(user.id), { activo: action === 'reactivate' });
        toast.add({
            title: action === 'delete' ? 'Usuario eliminado' : action === 'reactivate' ? 'Usuario reactivado' : 'Usuario desactivado',
            description: action === 'delete' ? 'La cuenta fue dada de baja y su correo quedó liberado.' : action === 'reactivate' ? 'La cuenta vuelve a estar activa.' : 'La cuenta fue suspendida. Su correo sigue reservado.',
            type: 'success',
        });
        setCurrentPage(1);
        setListRefreshVersion((version) => version + 1);
    }

    async function confirmAdminAction() {
        if (!pendingAdminAction || pendingAdminAction.user.eliminadoEn != null) return;
        const {user, action} = pendingAdminAction;
        if (action === 'reset-password') {
            await apiClient.post(
                `/admin/users/${encodeURIComponent(String(user.id))}/password/reset`,
                {},
            );
            toast.add({
                title: 'Contraseña restablecida',
                description: 'Se ha generado una clave temporal y fue despechada al correo del usuario.',
                type: 'success',
                priority: 'high',
            });
            return;
        }

        await apiClient.post(
            `/admin/users/${encodeURIComponent(String(user.id))}/2fa/reset`,
            {},
        );
        setUsers((currentUsers) =>
            currentUsers.map((currentUser) =>
                currentUser.id === user.id
                    ? {
                        ...currentUser,
                        twoFactor: 'Desactivado',
                    }
                    : currentUser,
            ),
        );
        toast.add({
            title: '2FA desvinculado',
            description:
                'La aplicación autenticadora fue desvinculada. El usuario deberá escanear un nuevo código QR en su próximo inicio de sesión.',
            type: 'success',
            priority: 'high',
        });
    }
    useEffect(() => {
        const controller = new AbortController();

        async function loadUsers() {
            setIsLoading(true);
            setErrorMessage(null);
            try {
                const data = await apiClient.get<ResumenUsuarios>('/admin/users', { signal: controller.signal });
                setUsers((data.users ?? []).map(toUserRow));
                setSummary({
                    total: data.summary?.total ?? 0,
                    admins: data.summary?.admins ?? 0,
                    operators: data.summary?.operators ?? 0,
                });
            } catch (error) {
                if (controller.signal.aborted) return;
                setErrorMessage(
                    error instanceof ApiRequestError
                        ? error.message
                        : 'No se pudo cargar la lista de usuarios. Intentá nuevamente.',
                );
            } finally {
                if (!controller.signal.aborted) setIsLoading(false);
            }
        }

        loadUsers();
        return () => controller.abort();
    }, [listRefreshVersion]);

    const lastAccessFromTimestamp = lastAccessFrom ? new Date(`${lastAccessFrom}T00:00:00`).getTime() : null;
    const lastAccessToTimestamp = lastAccessTo ? new Date(`${lastAccessTo}T23:59:59.999`).getTime() : null;
    const displayedUsers = userFilter === 'deleted' ? (deletedUsersState.deletedUsers ?? []).map(toUserRow) : users;
    const isListLoading = userFilter === 'deleted' ? deletedUsersState.isLoading : isLoading;
    const listErrorMessage = userFilter === 'deleted' ? deletedUsersState.errorMessage : errorMessage;
    const filteredUsers = displayedUsers.filter((user) => {
        const lastAccessTimestamp = user.lastAccessRaw ? Date.parse(user.lastAccessRaw) : NaN;
        return (userFilter === 'deleted' ? user.eliminadoEn != null : user.eliminadoEn == null)
            && (userFilter === 'all' || userFilter === 'deleted' || user.role === userFilter)
            && (userFilter === 'deleted' || statusFilter === 'all' || user.status === (statusFilter === 'active' ? 'Activo' : 'Inactivo'))
            && (twoFactorFilter === 'all' || user.twoFactor === (twoFactorFilter === 'enabled' ? 'Activado' : 'Desactivado'))
            && ((lastAccessFromTimestamp === null && lastAccessToTimestamp === null)
                || (Number.isFinite(lastAccessTimestamp)
                    && (lastAccessFromTimestamp === null || lastAccessTimestamp >= lastAccessFromTimestamp)
                    && (lastAccessToTimestamp === null || lastAccessTimestamp <= lastAccessToTimestamp)))
            && Object.entries(user).some(([key, value]) =>
                key !== 'lastAccessRaw' && String(value).toLowerCase().includes(searchTerm.toLowerCase())
            );
    });
    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
    const firstUserIndex = (currentPage - 1) * USERS_PER_PAGE;
    const paginatedUsers = filteredUsers.slice(firstUserIndex, firstUserIndex + USERS_PER_PAGE);
    const firstVisibleUser = filteredUsers.length === 0 ? 0 : firstUserIndex + 1;
    const lastVisibleUser = Math.min(firstUserIndex + USERS_PER_PAGE, filteredUsers.length);

    return (
        <section className="flex min-w-0 self-start flex-col gap-6 text-slate-900">
            {pendingAccountAction && <ConfirmUserAction
                variant={pendingAccountAction.action === 'reactivate' ? 'confirmation' : 'destructive'}
                onCompleted={() => setPendingAccountAction(null)}
                title={pendingAccountAction.action === 'delete' ? 'Eliminar usuario' : pendingAccountAction.action === 'reactivate' ? 'Reactivar usuario' : 'Desactivar usuario'}
                description={pendingAccountAction.action === 'delete' ? userDeletionMessage : pendingAccountAction.action === 'reactivate' ? userReactivationMessage : userSuspensionMessage}
                onConfirm={confirmAccountAction} onCancel={() => setPendingAccountAction(null)}
            />}
                        {pendingAdminAction && (
                <ConfirmUserAction
                    variant={
                        pendingAdminAction.action === 'reset-2fa'
                            ? 'destructive'
                            : 'confirmation'
                    }
                    title={
                        pendingAdminAction.action === 'reset-password'
                            ? 'Restablecer contraseña'
                            : 'Desvincular 2FA'
                    }
                    description={
                        pendingAdminAction.action === 'reset-password'
                            ? `Se generará una nueva contraseña temporal para ${pendingAdminAction.user.name} y será enviada a su correo. La contraseña no se mostrará en pantalla. También se invalidarán sus sesiones activas.`
                            : 'Esta acción desvinculará la aplicación autenticadora del usuario. Se le exigirá escanear un nuevo código QR en su próximo inicio de sesión. También se invalidarán todas sus sesiones activas.'
                    }
                    onConfirm={confirmAdminAction}
                    onCompleted={() => setPendingAdminAction(null)}
                    onCancel={() => setPendingAdminAction(null)}
                />
            )}
            {/* Cabecera */}
            <div className="flex flex-wrap items-start justify-between gap-5 pb-1">
                <div>
                    <h1 className="mb-2 text-[30px] font-semibold tracking-tight text-slate-900">Gestión de usuarios</h1>
                    <p className="text-secundario">Administra los usuarios, roles y permisos del sistema.</p>
                </div>
                <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="pointer-events-none absolute top-3 left-3 z-10 size-4 text-slate-500" aria-hidden="true" />
                        <Input
                            type="text"
                            placeholder="Buscar usuario..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(event) => {
                                setSearchTerm(event.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <Filter className="size-4!" /> Filtros
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[240px] max-w-[calc(100vw-2rem)]">
                            <DropdownMenuRadioGroup value={statusFilter === 'all' ? '' : statusFilter} onValueChange={(value) => {
                                if (value === 'active' || value === 'inactive') {
                                    setStatusFilter(value);
                                    setCurrentPage(1);
                                }
                            }}>
                                <DropdownMenuLabel>Estado</DropdownMenuLabel>
                                <DropdownMenuRadioItem value="inactive">Usuarios inactivos</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="active">Usuarios activos</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={twoFactorFilter === 'all' ? '' : twoFactorFilter} onValueChange={(value) => {
                                if (value === 'enabled' || value === 'disabled') {
                                    setTwoFactorFilter(value);
                                    setCurrentPage(1);
                                }
                            }}>
                                <DropdownMenuLabel>2FA</DropdownMenuLabel>
                                <DropdownMenuRadioItem value="enabled">2FA habilitado</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="disabled">2FA deshabilitado</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>Último acceso</DropdownMenuLabel>
                                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-700">
                                    <Calendar className="size-4 text-slate-500" aria-hidden="true" />
                                    <input
                                        type="date"
                                        aria-label="Desde"
                                        value={lastAccessFrom}
                                        onChange={(event) => {
                                            setLastAccessFrom(event.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="bg-transparent outline-none"
                                    />
                                    <span>-</span>
                                    <input
                                        type="date"
                                        aria-label="Hasta"
                                        value={lastAccessTo}
                                        onChange={(event) => {
                                            setLastAccessTo(event.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="bg-transparent outline-none"
                                    />
                                </div>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem checked={statusFilter === 'all' && twoFactorFilter === 'all' && !lastAccessFrom && !lastAccessTo} onCheckedChange={() => {
                                setStatusFilter('all');
                                setTwoFactorFilter('all');
                                setLastAccessFrom('');
                                setLastAccessTo('');
                                setCurrentPage(1);
                            }}>
                                Limpiar filtros
                            </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button type="button" onClick={() => navigate('/users/new')}>
                        <UserPlus className="size-4!" /> Nuevo usuario
                    </Button>
                </div>
            </div>

            <Tabs value={userFilter} onValueChange={(value) => {
                if (value === 'all' || value === 'ADMIN' || value === 'OPERATOR' || value === 'deleted') {
                    setUserFilter(value);
                    setCurrentPage(1);
                    setOpenDropdownId(null);
                }
            }} className="min-w-0 gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <TabsList variant="line" aria-label="Filtrar usuarios" className="max-w-full">
                        <TabsTrigger value="all" className="px-4"><UsersRound /> Usuarios totales <Badge variant="secondary">{summary.total}</Badge></TabsTrigger>
                        <TabsTrigger value="ADMIN" className="px-4"><Shield /> Administradores <Badge variant="secondary">{summary.admins}</Badge></TabsTrigger>
                        <TabsTrigger value="OPERATOR" className="px-4"><UserRound /> Operadores <Badge variant="secondary">{summary.operators}</Badge></TabsTrigger>
                        <TabsTrigger value="deleted" className="px-4"><UserX /> Eliminados <Badge variant="secondary">{deletedUsersState.deletedUsers?.length ?? EMPTY_TEXT}</Badge></TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value={userFilter} className="min-w-0">
                    <Card className="min-w-0 overflow-hidden rounded-xl border-slate-100 py-0 shadow-sm ring-0">
                        <Table className="min-w-[52rem] text-xs text-slate-700" aria-busy={isListLoading}>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                                        <TableHead className="header-of-table px-4">Usuario</TableHead>
                                        <TableHead className="header-of-table px-4">Rol</TableHead>
                                        <TableHead className="header-of-table px-4">Estado</TableHead>
                                        <TableHead className="header-of-table px-4">Último acceso</TableHead>
                                        <TableHead className="header-of-table px-4">2FA</TableHead>
                                        <TableHead className="header-of-table px-4 text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isListLoading &&
                                        Array.from({ length: 4 }).map((_, index) => (
                                            <TableRow key={`skeleton-${index}`} className="animate-pulse">
                                                <TableCell className="p-4"><div className="h-9 w-48 rounded bg-slate-100" /></TableCell>
                                                <TableCell className="p-4"><div className="h-5 w-24 rounded bg-slate-100" /></TableCell>
                                                <TableCell className="p-4"><div className="h-5 w-20 rounded bg-slate-100" /></TableCell>
                                                <TableCell className="p-4"><div className="h-5 w-28 rounded bg-slate-100" /></TableCell>
                                                <TableCell className="p-4"><div className="h-5 w-16 rounded bg-slate-100" /></TableCell>
                                                <TableCell className="p-4"><div className="ml-auto h-5 w-8 rounded bg-slate-100" /></TableCell>
                                            </TableRow>
                                        ))}

                                    {!isListLoading && listErrorMessage && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="px-4 py-10 text-center text-sm text-red-600" role="alert">
                                                {listErrorMessage}
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {!isListLoading && !listErrorMessage && filteredUsers.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                                                {displayedUsers.length === 0
                                                    ? 'Todavía no hay usuarios para mostrar.'
                                                    : searchTerm.trim()
                                                        ? 'No se encontraron usuarios que coincidan con la búsqueda.'
                                                        : 'No hay usuarios en esta categoría.'}
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {!isListLoading && !listErrorMessage && paginatedUsers.map((user) => (
                                        <TableRow
                                            key={user.id}
                                            className="hover:bg-slate-50/70"
                                        >
                                            <TableCell className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`size-9 rounded-full flex items-center justify-center font-bold text-xs ${user.avatarBg}`}>
                                                        {user.roleType}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-destacado">{user.name}</span>
                                                        <span className="table-text-secondary ">{user.email}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                                                    <Shield className="size-3 text-slate-500" /> {user.role}
                                                </span>
                                            </TableCell>
                                            <TableCell className="p-4">
                                                {user.eliminadoEn != null ? <Badge variant="destructive">Eliminado</Badge> : user.status === 'Activo' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <CheckCircle2 className="size-3" /> Activo
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                        <XCircle className="size-3" /> Inactivo
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="p-4 text-secundario">{user.lastAccess}</TableCell>
                                            <TableCell className="p-4">
                                                <span className={`text-xs font-medium ${user.twoFactor.includes('Activado') ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                    {user.twoFactor}
                                                </span>
                                            </TableCell>
                                            <TableCell className="relative p-4 text-right">
                                                <button
                                                    disabled={user.eliminadoEn != null}
                                                    onClick={() => setOpenDropdownId(openDropdownId === user.id ? null : user.id)}
                                                    className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 transition-colors inline-flex items-center justify-center"
                                                    aria-label={`Acciones para ${user.name}`}
                                                >
                                                    <MoreVertical className="size-4" />
                                                </button>

                                                {user.eliminadoEn == null && openDropdownId === user.id && (
                                                    <div className="absolute right-8 top-10 w-52 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10 text-left">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setOpenDropdownId(null);
                                                                
                                                                navigate(
                                                                    `/users/${encodeURIComponent(String(user.id))}`,
                                                                    { state: { isCurrentUser: user.isCurrentUser } satisfies UserDetailsNavigationState },
                                                                )
                                                            }}
                                                            className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                        >
                                                            <Edit3 className="size-3.5 text-slate-500" /> Editar usuario
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setOpenDropdownId(null);
                                                                setPendingAdminAction({
                                                                    user,
                                                                    action: 'reset-password',
                                                                });
                                                            }}
                                                            className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                        >
                                                            <Key className="size-3.5 text-slate-500" /> 
                                                            Restablecer contraseña
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setOpenDropdownId(null);
                                                                setPendingAdminAction({
                                                                    user,
                                                                    action: 'reset-2fa',
                                                                });
                                                            }}
                                                            className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                        >
                                                            <QrCode className="size-3.5 text-slate-500" /> 
                                                            Restablecer 2FA
                                                        </button>
                                                        <button onClick={() => { setOpenDropdownId(null); setPendingAccountAction({ user, action: user.status === 'Activo' ? 'deactivate' : 'reactivate' }); }} className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                                            <UserKey className="size-3.5 text-amber-500" /> {user.status === 'Activo' ? 'Desactivar usuario' : 'Reactivar usuario'}
                                                        </button>
                                                        <button onClick={() => { setOpenDropdownId(null); setPendingAccountAction({ user, action: 'delete' }); }} className="w-full px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100">
                                                            <Trash2 className="size-3.5" /> Eliminar usuario
                                                        </button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                        {/* Paginador */}
                        <div className="flex flex-col sm:flex-row items-center justify-between p-5 border-t border-slate-100 gap-4 text-xs text-secundario">
                            <div>
                                Mostrando <strong>{firstVisibleUser} a {lastVisibleUser}</strong> de <strong>{filteredUsers.length}</strong> usuarios
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
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </section>
    );
}
