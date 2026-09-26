import { ConfirmUserAction } from '@/components/common/ConfirmUserAction';
import { deactivateUserAccount } from '@/components/features/users/services/userDeactivationService';
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
    ChevronLeft,
    ChevronRight,
    Key,
    UserX,
    Trash2,
    Edit3,
    QrCode
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ApiRequestError, apiClient } from '@/services/apiClient';
import { useNavigate } from 'react-router';
import type { UserDetailsNavigationState } from '@/components/features/users/types/user';

// Contrato real de GET /api/admin/users (UsuarioResumenDTO y su resumen).
interface UsuarioResumenDTO {
    id: string | number;
    nombreCompleto?: string | null;
    nombreUsuario?: string | null;
    emailUsuario?: string | null;
    rol?: string | null;
    activo?: boolean;
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
    lastAccess: string;
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
        status: dto.activo ? 'Activo' : 'Inactivo',
        lastAccess: formatLastAccess(dto.fechaUltimoAcceso),
        twoFactor: dto.totpVinculado ? 'Activado' : 'Desactivado',
        avatarBg: esAdmin ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800',
        isCurrentUser: dto.esUsuarioActual === true,
    };
}

export default function UsersPage() {
    const navigate = useNavigate();
    const [activeTab] = useState('users'); // 'users' o 'roles'
    const [openDropdownId, setOpenDropdownId] = useState<string | number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [users, setUsers] = useState<UserRow[]>([]);
    const [summary, setSummary] = useState({ total: 0, admins: 0, operators: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [pendingAccountAction, setPendingAccountAction] = useState<{ user: UserRow; action: 'delete' | 'deactivate' } | null>(null);
    const [pendingAdminAction, setPendingAdminAction] = useState<{
        user: UserRow;
        action: 'reset-password' | 'reset-2fa';
    } | null>(null);
    const [listRefreshVersion, setListRefreshVersion] = useState(0);
    async function confirmAccountAction() {
        if (!pendingAccountAction) return;
        await deactivateUserAccount(String(pendingAccountAction.user.id));
        toast.add({ title: pendingAccountAction.action === 'delete' ? 'Usuario eliminado' : 'Usuario desactivado', description: 'La cuenta fue desactivada y sus sesiones fueron invalidadas.', type: 'success' });
        setListRefreshVersion((version) => version + 1);
    }

    async function confirmAdminAction() {
        if (!pendingAdminAction) return;
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

    const filteredUsers = users.filter((user) =>
        Object.values(user).some((value) =>
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );
    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
    const firstUserIndex = (currentPage - 1) * USERS_PER_PAGE;
    const paginatedUsers = filteredUsers.slice(firstUserIndex, firstUserIndex + USERS_PER_PAGE);
    const firstVisibleUser = filteredUsers.length === 0 ? 0 : firstUserIndex + 1;
    const lastVisibleUser = Math.min(firstUserIndex + USERS_PER_PAGE, filteredUsers.length);

    const adminsPercentage = summary.total > 0 ? ((summary.admins / summary.total) * 100).toFixed(1) : '0.0';
    const operatorsPercentage = summary.total > 0 ? ((summary.operators / summary.total) * 100).toFixed(1) : '0.0';

    return (
        <section className="flex min-w-0 self-start flex-col gap-6 text-slate-900">
            {pendingAccountAction && <ConfirmUserAction variant="destructive" onCompleted={() => setPendingAccountAction(null)} title={pendingAccountAction.action === 'delete' ? 'Eliminar usuario' : 'Desactivar usuario'} description={`Se desactivará la cuenta de ${pendingAccountAction.user.name} y se invalidarán sus sesiones. La cuenta no se borrará físicamente.`} onConfirm={confirmAccountAction} onCancel={() => setPendingAccountAction(null)} />}
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
                    <Button type="button" variant="outline">
                        <Filter className="size-4!" /> Filtros
                    </Button>
                    <Button type="button" onClick={() => navigate('/users/new')}>
                        <UserPlus className="size-4!" /> Nuevo usuario
                    </Button>
                </div>
            </div>

            {/* Tarjetas de Métricas Superiores */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="flex flex-col justify-between rounded-xl border-slate-100 p-5 shadow-sm ring-0">
                    <h4>Usuarios totales</h4>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-metrica">{summary.total}</span>
                        <span className="text-caption">En el sistema</span>
                    </div>
                </Card>

                <Card className="flex flex-col justify-between rounded-xl border-slate-100 p-5 shadow-sm ring-0">
                    <h4>Administradores</h4>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-metrica text-blue-600">{summary.admins}</span>
                        <span className="text-caption text-blue-600">{adminsPercentage}% del total</span>
                    </div>
                </Card>

                <Card className="flex flex-col justify-between rounded-xl border-slate-100 p-5 shadow-sm ring-0">
                    <h4>Operadores</h4>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-metrica">{summary.operators}</span>
                        <span className="text-caption text-slate-600">{operatorsPercentage}% del total</span>
                    </div>
                </Card>

                {/*
                    Tarjeta "Solo lectura" retirada: el contrato de Swagger de GET /api/admin/users
                    solo expone las métricas total, admins y operators. READ_ONLY es un nivel de acceso
                    de instancia, no un rol de usuario, así que no hay un contador que la respalde.
                    Se conserva el markup original comentado para recuperarlo si el backend lo expone.

                <Card className="flex flex-col justify-between rounded-xl border-slate-100 p-5 shadow-sm ring-0">
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Solo lectura</span>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-metrica">2</span>
                        <span className="text-xs font-medium text-slate-600">16.7% del total</span>
                    </div>
                </Card>
                */}
            </div>



            {/* Tabla de Usuarios */}
            {activeTab === 'users' && (
                <div className="min-w-0">
                    <Card className="min-w-0 overflow-hidden rounded-xl border-slate-100 py-0 shadow-sm ring-0">
                        <Table className="min-w-[52rem] text-xs text-slate-700" aria-busy={isLoading}>
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
                                    {isLoading &&
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

                                    {!isLoading && errorMessage && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="px-4 py-10 text-center text-sm text-red-600" role="alert">
                                                {errorMessage}
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {!isLoading && !errorMessage && filteredUsers.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                                                {users.length === 0
                                                    ? 'Todavía no hay usuarios para mostrar.'
                                                    : 'No se encontraron usuarios que coincidan con la búsqueda.'}
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {!isLoading && !errorMessage && paginatedUsers.map((user) => (
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
                                                {user.status === 'Activo' ? (
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
                                                    onClick={() => setOpenDropdownId(openDropdownId === user.id ? null : user.id)}
                                                    className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 transition-colors inline-flex items-center justify-center"
                                                    aria-label={`Acciones para ${user.name}`}
                                                >
                                                    <MoreVertical className="size-4" />
                                                </button>

                                                {openDropdownId === user.id && (
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
                                                        <button onClick={() => { setOpenDropdownId(null); setPendingAccountAction({ user, action: 'deactivate' }); }} className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                                            <UserX className="size-3.5 text-amber-500" /> Desactivar usuario
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
                                <div className="flex items-center gap-1">
                                    <span>10 por página</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        aria-label="Página anterior"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                        className="rounded border border-slate-200 bg-white p-1.5 text-slate-700 transition-colors hover:bg-slate-100 disabled:text-slate-400/50"
                                    >
                                        <ChevronLeft className="size-4" />
                                    </button>
                                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                                        <button
                                            key={page}
                                            type="button"
                                            aria-current={currentPage === page ? 'page' : undefined}
                                            onClick={() => setCurrentPage(page)}
                                            className={currentPage === page
                                                ? 'rounded border border-blue-600 bg-blue-600 px-3 py-1 font-medium text-white'
                                                : 'rounded px-3 py-1 text-slate-700 hover:bg-slate-100'}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        aria-label="Página siguiente"
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                        className="rounded border border-slate-200 bg-white p-1.5 text-slate-700 transition-colors hover:bg-slate-100 disabled:text-slate-400/50"
                                    >
                                        <ChevronRight className="size-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </section>
    );
}
