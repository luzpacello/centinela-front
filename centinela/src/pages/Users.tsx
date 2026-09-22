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
    Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ApiRequestError, apiClient } from '@/services/apiClient';

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
}

const EMPTY_TEXT = '—';

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
    };
}

export default function UsersPage() {
    const [activeTab, setActiveTab] = useState('users'); // 'users' o 'roles'
    const [openDropdownId, setOpenDropdownId] = useState<string | number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<UserRow[]>([]);
    const [summary, setSummary] = useState({ total: 0, admins: 0, operators: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    }, []);

    const filteredUsers = users.filter((user) =>
        Object.values(user).some((value) =>
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const adminsPercentage = summary.total > 0 ? ((summary.admins / summary.total) * 100).toFixed(1) : '0.0';
    const operatorsPercentage = summary.total > 0 ? ((summary.operators / summary.total) * 100).toFixed(1) : '0.0';

    return (
        <section className="flex min-w-0 self-start flex-col gap-6 text-slate-900">
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
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>
                    <Button type="button" variant="outline">
                        <Filter className="size-4!" /> Filtros
                    </Button>
                    <Button type="button" className="bg-blue-600 text-white shadow-sm hover:bg-blue-700">
                        <UserPlus className="size-4!" /> Nuevo usuario
                    </Button>
                </div>
            </div>

            {/* Tarjetas de Métricas Superiores */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="flex flex-col justify-between rounded-xl border-slate-100 p-5 shadow-sm ring-0">
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Usuarios totales</span>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-metrica">{summary.total}</span>
                        <span className="text-caption">En el sistema</span>
                    </div>
                </Card>

                <Card className="flex flex-col justify-between rounded-xl border-slate-100 p-5 shadow-sm ring-0">
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Administradores</span>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-metrica text-blue-600">{summary.admins}</span>
                        <span className="text-xs font-medium text-blue-600">{adminsPercentage}% del total</span>
                    </div>
                </Card>

                <Card className="flex flex-col justify-between rounded-xl border-slate-100 p-5 shadow-sm ring-0">
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Usuarios estándar</span>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-metrica">{summary.operators}</span>
                        <span className="text-xs font-medium text-slate-600">{operatorsPercentage}% del total</span>
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

            {/* Pestañas principales y Barra de Acciones */}
            <Card className="gap-0 overflow-hidden rounded-xl border-slate-100 py-0 shadow-sm ring-0">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 pt-3">
                    <div className="flex flex-wrap items-center gap-1">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'users'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Usuarios
                        </button>
                        <button
                            onClick={() => setActiveTab('roles')}
                            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'roles'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Roles y permisos
                        </button>
                    </div>
                </div>

                {activeTab === 'roles' && (
                    <div className="py-4 text-sm text-secundario">
                        Vista de configuración de Roles y Permisos (Sección informativa de roles del sistema).
                    </div>
                )}
            </Card>

            {/* Tabla de Usuarios */}
            {activeTab === 'users' && (
                <div className="min-w-0">
                    <Card className="min-w-0 overflow-hidden rounded-xl border-slate-100 py-0 shadow-sm ring-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="border-b border-slate-100 bg-slate-50/60 text-slate-700">
                                    <tr className="text-xs font-medium uppercase tracking-wider">
                                        <th className="py-3.5 px-4">Usuario</th>
                                        <th className="py-3.5 px-4">Rol</th>
                                        <th className="py-3.5 px-4">Estado</th>
                                        <th className="py-3.5 px-4">Último acceso</th>
                                        <th className="py-3.5 px-4">2FA</th>
                                        <th className="py-3.5 px-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                    {isLoading &&
                                        Array.from({ length: 4 }).map((_, index) => (
                                            <tr key={`skeleton-${index}`} className="animate-pulse">
                                                <td className="py-3 px-4"><div className="h-9 w-48 rounded bg-slate-100" /></td>
                                                <td className="py-3 px-4"><div className="h-5 w-24 rounded bg-slate-100" /></td>
                                                <td className="py-3 px-4"><div className="h-5 w-20 rounded bg-slate-100" /></td>
                                                <td className="py-3 px-4"><div className="h-5 w-28 rounded bg-slate-100" /></td>
                                                <td className="py-3 px-4"><div className="h-5 w-16 rounded bg-slate-100" /></td>
                                                <td className="py-3 px-4"><div className="ml-auto h-5 w-8 rounded bg-slate-100" /></td>
                                            </tr>
                                        ))}

                                    {!isLoading && errorMessage && (
                                        <tr>
                                            <td colSpan={6} className="py-10 px-4 text-center text-sm text-red-600" role="alert">
                                                {errorMessage}
                                            </td>
                                        </tr>
                                    )}

                                    {!isLoading && !errorMessage && filteredUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="py-10 px-4 text-center text-sm text-slate-500">
                                                {users.length === 0
                                                    ? 'Todavía no hay usuarios para mostrar.'
                                                    : 'No se encontraron usuarios que coincidan con la búsqueda.'}
                                            </td>
                                        </tr>
                                    )}

                                    {!isLoading && !errorMessage && filteredUsers.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="transition-colors hover:bg-blue-50/50"
                                        >
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`size-9 rounded-full flex items-center justify-center font-bold text-xs ${user.avatarBg}`}>
                                                        {user.roleType}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-900">{user.name}</span>
                                                        <span className="text-xs text-secundario">{user.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                                                    <Shield className="size-3 text-slate-500" /> {user.role}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                {user.status === 'Activo' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <CheckCircle2 className="size-3" /> Activo
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                        <XCircle className="size-3" /> Inactivo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-secundario">{user.lastAccess}</td>
                                            <td className="py-3 px-4">
                                                <span className={`text-xs font-medium ${user.twoFactor.includes('Activado') ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                    {user.twoFactor}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right relative">
                                                <button
                                                    onClick={() => setOpenDropdownId(openDropdownId === user.id ? null : user.id)}
                                                    className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 transition-colors inline-flex items-center justify-center"
                                                    aria-label={`Acciones para ${user.name}`}
                                                >
                                                    <MoreVertical className="size-4" />
                                                </button>

                                                {openDropdownId === user.id && (
                                                    <div className="absolute right-8 top-10 w-52 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10 text-left">
                                                        <button className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                                            <Edit3 className="size-3.5 text-slate-500" /> Editar usuario
                                                        </button>
                                                        <button className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                                            <Key className="size-3.5 text-slate-500" /> Restablecer contraseña
                                                        </button>
                                                        <button className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                                            <UserX className="size-3.5 text-amber-500" /> Desactivar usuario
                                                        </button>
                                                        <button className="w-full px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100">
                                                            <Trash2 className="size-3.5" /> Eliminar usuario
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginador */}
                        <div className="flex flex-col sm:flex-row items-center justify-between p-5 border-t border-slate-100 gap-4 text-xs text-secundario">
                            <div>
                                Mostrando <strong>1 a 8</strong> de <strong>12</strong> usuarios
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                    <span>10 por página</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button type="button" aria-label="Página anterior" disabled className="rounded border border-slate-200 bg-white p-1.5 text-slate-400/50">
                                        <ChevronLeft className="size-4" />
                                    </button>
                                    <button type="button" aria-current="page" className="rounded border border-blue-600 bg-blue-600 px-3 py-1 font-medium text-white">1</button>
                                    <button type="button" className="rounded px-3 py-1 text-slate-700 hover:bg-slate-100">2</button>
                                    <button type="button" aria-label="Página siguiente" className="rounded border border-slate-200 bg-white p-1.5 text-slate-700 transition-colors hover:bg-slate-100">
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
