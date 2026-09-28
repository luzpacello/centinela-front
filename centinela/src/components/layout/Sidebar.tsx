import { useState } from 'react';
import { NavLink } from 'react-router';
import {
    Activity,
    Bell,
    ChevronDown,
    Circle,
    LayoutDashboard,
    LogOut,
    PanelLeftClose,
    PanelLeftOpen,
    Server,
    UserRound,
    Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserSession } from '@/components/features/auth/types/authentication';
import { useLogout } from '@/components/features/auth/hooks/useAuth';
import logoCentinela from '@/assets/logo.png';

export default function Sidebar({ user }: { user?: UserSession }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { isLoggingOut, logout } = useLogout();

    const displayName = user?.nombreCompleto ?? 'Administrador';
    const roleName = user?.rol ?? 'Admin';
    const initials = displayName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join('')
        .toUpperCase();

    return (
        <aside className={`${style.asideBase} ${isCollapsed ? 'w-16' : 'w-64'}`}>

            {/* ENCABEZADO Y LOGO */}
            <div className={`${style.headerBase} ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-5'}`}>
                {/* Contenedor circular para el logo */}
                <div className={style.logoWrapper}>
                    <img
                        src={logoCentinela}
                        alt="El Centinela"
                        className={style.logoImage}
                    />
                </div>

                {!isCollapsed && (
                    <div className={style.headerTextContainer}>
                        <p className={style.headerTitle}>El Centinela</p>
                        <p className={style.headerSubtitle}>Panel de control</p>
                    </div>
                )}
            </div>

            {/* NAVEGACIÓN PRINCIPAL */}
            <nav aria-label="Navegación principal" className={`${style.navBase} ${isCollapsed ? 'px-2' : 'px-3'}`}>
                <div className={`${style.navHeaderBase} ${isCollapsed ? 'justify-center' : 'justify-between px-3'}`}>
                    {!isCollapsed && <p className={style.navLabel}>General</p>}

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={isCollapsed ? 'Expandir' : 'Contraer'}
                        onClick={() => setIsCollapsed((collapsed) => !collapsed)}
                    >
                        {isCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
                    </Button>
                </div>

                <div className={style.navLinksContainer}>
                    <NavLink to="/dashboard" title={isCollapsed ? 'Dashboard' : undefined} className={({ isActive }) => getNavigationLinkClassName({ isActive, isCollapsed })}>
                        <LayoutDashboard className="size-4.5" aria-hidden="true" />
                        {!isCollapsed && <span>Dashboard</span>}
                    </NavLink>
                    <NavLink to="/instances" title={isCollapsed ? 'Instancias' : undefined} className={({ isActive }) => getNavigationLinkClassName({ isActive, isCollapsed })}>
                        <Server className="size-4.5" aria-hidden="true" />
                        {!isCollapsed && <span>Instancias</span>}
                    </NavLink>
                    <NavLink to="/auditoria" title={isCollapsed ? 'Auditoría' : undefined} className={({ isActive }) => getNavigationLinkClassName({ isActive, isCollapsed })}>
                        <Activity className="size-4.5" aria-hidden="true" />
                        {!isCollapsed && <span>Auditoría</span>}
                    </NavLink>

                    {user?.rol === 'ADMIN' && (
                        <NavLink to="/users" title={isCollapsed ? 'Usuarios' : undefined} className={({ isActive }) => getNavigationLinkClassName({ isActive, isCollapsed })}>
                            <Users className="size-4.5" aria-hidden="true" />
                            {!isCollapsed && <span>Usuarios</span>}
                        </NavLink>
                    )}
                </div>
            </nav>

            {/* PIE DE PÁGINA (INFRAESTRUCTURA Y USUARIO) */}
            <div className={`${style.footerBase} ${isCollapsed ? 'p-2' : 'p-3'}`}>

                {/* TARJETA INFRAESTRUCTURA */}
                {!isCollapsed && (
                    <div className={style.infraCard}>
                        <span className={style.infraIconWrapper}>
                            <Server className="size-4" aria-hidden="true" />
                        </span>
                        <div className={style.infraTextContainer}>
                            <p className={style.infraTitle}>Infraestructura</p>
                            <p className={style.infraSubtitle}>
                                <span className={style.infraDot} aria-hidden="true" />
                                Administración de nodos
                            </p>
                        </div>
                    </div>
                )}

                <div className="relative">
                    {/* OVERLAY DEL MENÚ */}
                    {isOpen && (
                        <button
                            type="button"
                            aria-label="Cerrar menú de usuario"
                            className={style.menuOverlay}
                            onClick={() => setIsOpen(false)}
                        />
                    )}

                    {/* MENÚ DESPLEGABLE */}
                    <div id="sidebar-account-menu" role="menu" aria-label="Menú de cuenta" hidden={!isOpen} className={style.menuDropdown}>
                        <div className={style.menuHeader}>
                            <p className={style.menuUserName}>{displayName}</p>
                            <p className={style.menuUserEmail}>{user?.email ?? roleName}</p>
                        </div>
                        <Button
                            type="button"
                            role="menuitem"
                            variant="ghost"
                            className="w-full justify-start gap-2 font-normal text-sm text-slate-700"
                            onClick={() => setIsOpen(false)}
                        >
                            <UserRound className="size-4" aria-hidden="true" /> Cuenta
                        </Button>
                        <Button
                            type="button"
                            role="menuitem"
                            variant="ghost"
                            className="w-full justify-start gap-2 font-normal text-sm text-slate-700"
                            onClick={() => setIsOpen(false)}
                        >
                            <Bell className="size-4" aria-hidden="true" /> Notificaciones
                        </Button>
                        <Button
                            type="button"
                            role="menuitem"
                            variant="ghost"
                            className="w-full justify-start gap-2 font-normal text-sm text-slate-700"
                            onClick={() => setIsOpen(false)}
                        >
                            <Circle className="size-4" aria-hidden="true" /> Estado
                        </Button>

                        <div className={style.menuDivider} />

                        <Button
                            type="button"
                            role="menuitem"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setIsOpen(false);
                                void logout();
                            }}
                            disabled={isLoggingOut}
                            className={style.menuLogoutBtn}
                        >
                            <LogOut className="size-4" aria-hidden="true" />
                            <span>{isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}</span>
                        </Button>
                    </div>

                    {/* BOTÓN TRIGGER DEL USUARIO */}
                    <button
                        type="button"
                        onClick={() => setIsOpen((open) => !open)}
                        aria-expanded={isOpen}
                        aria-haspopup="menu"
                        aria-controls="sidebar-account-menu"
                        aria-label={isCollapsed ? `Abrir menú de ${displayName}` : undefined}
                        title={isCollapsed ? displayName : undefined}
                        className={`${style.triggerBtnBase} ${isCollapsed ? 'justify-center px-0' : 'px-2'}`}
                    >
                        <span className={style.triggerAvatar}>
                            {initials || 'AD'}
                        </span>
                        {!isCollapsed && (
                            <span className={style.triggerInfoContainer}>
                                <span className={style.triggerName}>{displayName}</span>
                                <span className={style.triggerEmail}>{user?.email ?? 'admin@centinela.com'}</span>
                            </span>
                        )}
                        {!isCollapsed && (
                            <ChevronDown className={`${style.triggerChevron} ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                        )}
                    </button>
                </div>
            </div>
        </aside>
    );
}

// LÓGICA DE CLASES PARA LOS ENLACES DE NAVEGACIÓN
function getNavigationLinkClassName({ isActive, isCollapsed }: { isActive: boolean; isCollapsed: boolean }) {
    return `flex items-center gap-3 rounded-md py-2.5 text-sm font-medium transition-colors ${isCollapsed ? 'justify-center px-0' : 'px-3'} ${isActive
        ? 'bg-blue-50 text-blue-700'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`;
}

// OBJETO DE ESTILOS EXTRAÍDOS
const style = {
    // Estructura general
    asideBase: 'flex h-full shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200',
    headerBase: 'flex h-18 items-center border-b border-slate-100',
    headerTextContainer: 'min-w-0',
    headerTitle: 'truncate text-base font-semibold text-slate-900',
    headerSubtitle: 'mt-0.5 text-xs text-slate-500',

    // Logo circular
    logoWrapper: 'flex aspect-square size-13 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm',
    logoImage: 'h-full w-full object-cover',

    // Navegación
    navBase: 'flex-1 py-4',
    navHeaderBase: 'mb-2 flex h-8 items-center',
    navLabel: 'text-[11px] font-semibold uppercase text-slate-400',
    collapseBtn: 'flex size-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
    navLinksContainer: 'space-y-1',

    // Footer y Tarjeta de Infraestructura
    footerBase: 'border-t border-slate-100',
    infraCard: 'mb-3 flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-3',
    infraIconWrapper: 'flex size-8 shrink-0 items-center justify-center rounded-md bg-white text-blue-600 ring-1 ring-slate-200',
    infraTextContainer: 'min-w-0 flex-1',
    infraTitle: 'truncate text-xs font-semibold text-slate-800',
    infraSubtitle: 'mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500',
    infraDot: 'size-1.5 rounded-full bg-emerald-500',

    // Menú Desplegable (Overlay y Contenedor)
    menuOverlay: 'fixed inset-0 z-10 cursor-default',
    menuDropdown: 'absolute bottom-0 left-full z-20 ml-2 w-60 rounded-xl border border-slate-200 bg-white p-1.5 text-slate-900 shadow-lg ring-1 ring-slate-200/60',
    menuHeader: 'border-b border-slate-200 px-2.5 py-2.5',
    menuUserName: 'truncate text-sm font-semibold text-slate-900',
    menuUserEmail: 'truncate text-xs text-slate-500',
    menuItemBtn: 'flex w-full items-center justify-start gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100',
    menuDivider: 'my-1 border-t border-slate-200',
    menuLogoutBtn: 'h-9 w-full justify-start gap-2 rounded-md px-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900',

    // Botón de Usuario (Trigger)
    triggerBtnBase: 'flex w-full items-center gap-3 rounded-lg py-2 text-left transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
    triggerAvatar: 'flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white',
    triggerInfoContainer: 'min-w-0 flex-1',
    triggerName: 'block truncate text-sm font-medium text-slate-900',
    triggerEmail: 'mt-0.5 block truncate text-xs text-slate-500',
    triggerChevron: 'size-4 shrink-0 text-slate-400 transition-transform'
};