import { useState } from 'react';
import { NavLink } from 'react-router';
import { ChevronDown, LogOut, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserSession } from '@/components/features/auth/types/authentication';
import { useLogout } from '@/components/features/auth/hooks/useAuth';

export default function Sidebar({ user }: { user?: UserSession }) {
    const [isOpen, setIsOpen] = useState(false);
    const { isLoggingOut, logout } = useLogout();

    const primerNombre = user?.nombreCompleto?.split(' ')[0] ?? 'Admin';
    const isAdmin = user?.rol === 'ADMIN';

    return (
        <aside className="flex h-full w-64 flex-col justify-between border-r border-slate-200 bg-white">
            {/* Parte Superior: Logo y Navegación */}
            <div>
                <div className="flex h-16 items-center px-6">
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                        {/* Cambiado a blue-600 para la gama austral */}
                        <span className="text-3xl leading-none text-blue-600"></span>
                        El Centinela
                    </h1>
                </div>

                <nav className="space-y-1 px-3 py-2">
                    <NavLink to="/dashboard" className={getNavigationLinkClassName}>
                        <span className="text-lg text-slate-400"></span> Dashboard
                    </NavLink>

                    <NavLink to="/instances" className={getNavigationLinkClassName}>
                        {/* El ícono de la vista activa ahora es blue-600 */}
                        <span className="text-lg text-blue-600"></span> Instancias
                    </NavLink>

                    {isAdmin && (
                        <>
                            <NavLink to="/users" end className={getNavigationLinkClassName}>
                                <span className="text-lg text-slate-400"></span> Usuarios
                            </NavLink>
                        </>
                    )}
                </nav>
            </div>

            {/* Parte Inferior: Estado y Perfil */}
            <div className="space-y-4 p-4">
                {/* Tarjeta de Proxmox VE */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2">
                        {/* Este punto y texto lo dejamos en verde porque en el diseño "Corriendo" es verde */}
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span className="text-sm font-semibold text-slate-900">Proxmox VE</span>
                        <span className="ml-auto rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">Conectado</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                        <div>
                            <p className="mb-0.5">Nodo</p>
                            <p className="font-medium text-slate-700">pve01</p>
                        </div>
                    </div>
                </div>

                {/* Contenedor del Perfil de Usuario con Menú Desplegable */}
                <div className="relative pt-2">
                    {isOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setIsOpen(false)}
                            />

                            <div className={style.dropdownCard}>
                                <div className={style.userInfoSection}>
                                    <div className={style.userNameRow}>
                                        <User className="size-4 text-slate-400" />
                                        <h4 className="m-0 truncate text-slate-900">{user?.nombreCompleto ?? 'Admin'}</h4>
                                    </div>
                                    <div className={style.userRoleRow}>
                                        <Shield className="size-3.5 text-blue-600" />
                                        <p className="text-caption text-blue-600">{user?.rol ?? 'Admin'}</p>
                                    </div>
                                </div>

                                <div className={style.divider} />

                                <div className={style.actionSection}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setIsOpen(false);
                                            logout();
                                        }}
                                        disabled={isLoggingOut}
                                        className={style.logoutButton}
                                    >
                                        <LogOut className={style.logoutIcon} aria-hidden="true" />
                                        <span className="bg-transparent">{isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}</span>
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}

                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        aria-expanded={isOpen}
                        className={style.triggerButton}
                    >
                        <div className={style.avatar}>
                            {primerNombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 text-left leading-tight">
                            <p className="text-sm font-semibold text-slate-900">{user?.nombreCompleto ?? 'Admin'}</p>
                            <p className="text-xs text-slate-500">{user?.rol ?? 'Administrador'}</p>
                        </div>
                        <ChevronDown className={`${style.arrowIcon} ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>
        </aside>
    );
}

// CORRECCIÓN PRINCIPAL: Colores activos en azul y hover en slate
function getNavigationLinkClassName({ isActive }: { isActive: boolean }) {
    return `flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${isActive
        ? 'bg-blue-50 text-blue-600'
        // Cambiamos el hover a bg-blue-50 y text-blue-600 para el efecto celeste
        : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600'
        }`;
}

const style = {
    triggerButton: 'flex w-full items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-100 focus:outline-none',
    avatar: 'flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white shadow-sm',
    arrowIcon: 'size-4 text-slate-400 transition-transform duration-200',
    dropdownCard: 'absolute bottom-full left-0 z-20 mb-2 w-full rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg ring-1 ring-black/5',
    userInfoSection: 'mb-1 flex flex-col gap-1 rounded-lg bg-slate-50 px-3 py-2.5',
    userNameRow: 'flex items-center gap-2',
    userRoleRow: 'flex items-center gap-1.5',
    divider: 'my-1 border-t border-slate-100',
    actionSection: 'p-0.5',
    logoutButton: 'flex w-full items-center justify-start gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 active:bg-blue-50 active:text-blue-800',
    logoutIcon: 'size-4',
};
