import { useState } from 'react';
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
    X,
    CalendarDays,
    Clock3,
    LockKeyhole
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function UsersPage() {
    const [activeTab, setActiveTab] = useState('users'); // 'users' o 'roles'
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserId, setSelectedUserId] = useState(1);

    // Mock de usuarios según el diseño
    const usersList = [
        {
            id: 1,
            name: 'AD Admin',
            email: 'admin@propex.local',
            role: 'Administrador',
            roleType: 'Admin',
            status: 'Activo',
            lastAccess: 'Hoy, 18:04',
            twoFactor: 'Activado',
            avatarBg: 'bg-emerald-100 text-emerald-800',
        },
        {
            id: 2,
            name: 'usuario1',
            email: 'usuario1@propex.local',
            role: 'Administrador',
            roleType: 'Admin',
            status: 'Activo',
            lastAccess: 'Hoy, 17:41',
            twoFactor: 'Activado',
            avatarBg: 'bg-blue-100 text-blue-800',
        },
        {
            id: 3,
            name: 'usuario2',
            email: 'usuario2@propex.local',
            role: 'Usuario estándar',
            roleType: 'US',
            status: 'Activo',
            lastAccess: 'Ayer, 22:15',
            twoFactor: 'Desactivado',
            avatarBg: 'bg-blue-100 text-blue-800',
        },
        {
            id: 4,
            name: 'operador',
            email: 'operador@propex.local',
            role: 'Usuario estándar',
            roleType: 'US',
            status: 'Activo',
            lastAccess: 'Ayer, 15:30',
            twoFactor: 'Activado',
            avatarBg: 'bg-blue-100 text-blue-800',
        },
        {
            id: 5,
            name: 'readonly',
            email: 'readonly@propex.local',
            role: 'Solo lectura',
            roleType: 'RO',
            status: 'Activo',
            lastAccess: '03/05/2024, 11:22',
            twoFactor: 'Desactivado',
            avatarBg: 'bg-slate-100 text-slate-700',
        },
        {
            id: 6,
            name: 'soporte',
            email: 'soporte@propex.local',
            role: 'Usuario estándar',
            roleType: 'US',
            status: 'Inactivo',
            lastAccess: 'Nunca',
            twoFactor: 'Desactivada',
            avatarBg: 'bg-amber-100 text-amber-800',
        },
        {
            id: 7,
            name: 'auditor',
            email: 'auditor@propex.local',
            role: 'Solo lectura',
            roleType: 'RO',
            status: 'Activo',
            lastAccess: '02/05/2024, 09:10',
            twoFactor: 'Activado',
            avatarBg: 'bg-slate-100 text-slate-700',
        },
        {
            id: 8,
            name: 'devops',
            email: 'devops@propex.local',
            role: 'Usuario estándar',
            roleType: 'US',
            status: 'Activo',
            lastAccess: '01/05/2024, 19:05',
            twoFactor: 'Activado',
            avatarBg: 'bg-blue-100 text-blue-800',
        },
    ];

    const filteredUsers = usersList.filter((user) =>
        Object.values(user).some((value) =>
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

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
                        <span className="text-metrica">12</span>
                        <span className="text-caption">En el sistema</span>
                    </div>
                </Card>

                <Card className="flex flex-col justify-between rounded-xl border-slate-100 p-5 shadow-sm ring-0">
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Administradores</span>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-metrica text-blue-600">3</span>
                        <span className="text-xs font-medium text-blue-600">25% del total</span>
                    </div>
                </Card>

                <Card className="flex flex-col justify-between rounded-xl border-slate-100 p-5 shadow-sm ring-0">
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Usuarios estándar</span>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-metrica">7</span>
                        <span className="text-xs font-medium text-slate-600">58.3% del total</span>
                    </div>
                </Card>

                <Card className="flex flex-col justify-between rounded-xl border-slate-100 p-5 shadow-sm ring-0">
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Solo lectura</span>
                    <div className="flex items-baseline justify-between mt-2">
                        <span className="text-metrica">2</span>
                        <span className="text-xs font-medium text-slate-600">16.7% del total</span>
                    </div>
                </Card>
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

                {activeTab === 'users' ? (
                    <div className="border-b border-slate-100 px-5 py-4 text-xs text-slate-500">
                        Seleccioná un usuario para ver su detalle y administrar sus permisos.
                    </div>
                ) : (
                    <div className="py-4 text-sm text-secundario">
                        Vista de configuración de Roles y Permisos (Sección informativa de roles del sistema).
                    </div>
                )}
            </Card>

            {/* Tabla de Usuarios */}
            {activeTab === 'users' && (
                <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
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
                                    {filteredUsers.map((user) => (
                                        <tr
                                            key={user.id}
                                            onClick={() => setSelectedUserId(user.id)}
                                            className={`cursor-pointer transition-colors hover:bg-blue-50/50 ${selectedUserId === user.id ? 'bg-blue-50/70' : ''}`}
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
                    <UserDetailPanel user={usersList.find((user) => user.id === selectedUserId) ?? usersList[0]} />
                </div>
            )}
        </section>
    );
}

function UserDetailPanel({ user }: { user: { name: string; email: string; role: string; status: string; lastAccess: string; twoFactor: string; roleType: string } }) {
    return (
        <Card className="flex min-h-[520px] flex-col gap-5 rounded-xl border-slate-100 p-5 shadow-sm ring-0">
            <div className="flex items-start justify-between">
                <span className={`flex size-16 items-center justify-center rounded-full text-xl font-semibold ${user.roleType === 'Admin' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                    {user.roleType}
                </span>
                <button type="button" className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Cerrar detalle">
                    <X className="size-4" />
                </button>
            </div>
            <div>
                <h2 className="mb-1 text-lg font-semibold">{user.name}</h2>
                <span className="inline-flex rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{user.role}</span>
                <p className="mt-2 text-xs text-slate-500">{user.email}</p>
            </div>
            <div className="space-y-3 border-t border-slate-100 pt-4 text-xs">
                <DetailLine icon={CheckCircle2} label="Estado" value={user.status} valueClass="text-emerald-600" />
                <DetailLine icon={Shield} label="Rol" value={user.role} />
                <DetailLine icon={CalendarDays} label="Fecha de creación" value="10/04/2024, 14:32" />
                <DetailLine icon={Clock3} label="Último acceso" value={user.lastAccess} />
                <DetailLine icon={LockKeyhole} label="Autenticación 2FA" value={user.twoFactor} valueClass={user.twoFactor.includes('Activado') ? 'text-emerald-600' : 'text-slate-500'} />
            </div>
            <div className="mt-auto grid gap-2">
                <Button type="button" variant="outline" className="w-full"><Edit3 className="size-4!" /> Editar usuario</Button>
                <Button type="button" variant="outline" className="w-full"><Key className="size-4!" /> Restablecer contraseña</Button>
                <Button type="button" variant="outline" className="w-full"><UserX className="size-4!" /> Desactivar usuario</Button>
                <Button type="button" variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50"><Trash2 className="size-4!" /> Eliminar usuario</Button>
            </div>
        </Card>
    );
}

function DetailLine({ icon: Icon, label, value, valueClass = 'text-slate-900' }: { icon: typeof CheckCircle2; label: string; value: string; valueClass?: string }) {
    return <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-slate-500"><Icon className="size-4" />{label}</span><strong className={`text-right font-medium ${valueClass}`}>{value}</strong></div>;
}