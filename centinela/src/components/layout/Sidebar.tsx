import { useState } from 'react';
import { NavLink } from 'react-router';
import { Bell, ChartNoAxesCombined, ChevronDown, LayoutGrid, LogOut, UserRound, UserPlus, Users, Circle } from 'lucide-react';
import {
    Sidebar as SidebarShell,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { UserSession } from '@/components/features/auth/types/authentication';
import { useLogout } from '@/components/features/auth/hooks/useAuth';
import logoCentinela from '@/assets/logo.png';

export default function Sidebar({ user }: { user?: UserSession }) {
    const { isLoggingOut, logout } = useLogout();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const isAdmin = user?.rol === 'ADMIN';
    const primerNombre = user?.nombreCompleto?.split(' ')[0] ?? 'Admin';

    const items = [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
        { to: '/instances', label: 'Instancias', icon: ChartNoAxesCombined },
    ];

    return (
        <SidebarShell collapsible="icon" className={style.sidebar}>

            {/* ENCABEZADO Y LOGO */}
            <SidebarHeader className={style.header}>
                <div className={style.headerContent}>
                    <div className={style.logoContainer}>
                        <img
                            src={logoCentinela}
                            alt="Logo El Centinela"
                            className={style.logoImage}
                        />
                    </div>
                    <div className={style.logoTextContainer}>
                        <p className={style.logoTitle}>El Centinela</p>
                        <p className={style.logoSubtitle}>Panel de control</p>
                    </div>
                </div>
            </SidebarHeader>

            {/* CONTENIDO PRINCIPAL */}
            <SidebarContent className="gap-4 p-3">
                <SidebarGroup>
                    <SidebarMenu className="space-y-1">
                        {items.map(({ to, label, icon: Icon }) => (
                            <SidebarMenuItem key={to}>
                                <NavigationItem to={to} label={label} icon={Icon} end={to === '/dashboard'} />
                            </SidebarMenuItem>
                        ))}

                        {isAdmin && (
                            <>
                                <SidebarMenuItem>
                                    <NavigationItem to="/users" label="Usuarios" icon={Users} />
                                </SidebarMenuItem>

                                <SidebarMenuItem>
                                    <NavigationItem to="/users/new" label="Crear usuario" icon={UserPlus} />
                                </SidebarMenuItem>
                            </>
                        )}
                    </SidebarMenu>
                </SidebarGroup>

                {/* TARJETA PROXMOX */}
                <div className={style.proxmoxCard}>
                    <div className={style.proxmoxHeader}>
                        <span className={style.proxmoxDot} aria-hidden="true" />
                        <span className={style.proxmoxTitle}>Proxmox VE</span>
                        <span className={style.proxmoxBadge}>Conectado</span>
                    </div>
                    <div className={style.proxmoxBody}>
                        <p className={style.proxmoxLabel}>Nodo</p>
                        <p className={style.proxmoxValue}>pve01</p>
                    </div>
                </div>
            </SidebarContent>

            {/* PIE DE PÁGINA (USUARIO) */}
            <SidebarFooter className={style.footer}>
                <div className="relative">
                    {/* BOTÓN DEL USUARIO */}
                    <button
                        type="button"
                        onClick={() => setIsUserMenuOpen((prev) => !prev)}
                        className={style.userTriggerBtn}
                    >
                        <div className={style.userAvatar}>
                            {primerNombre.charAt(0).toUpperCase()}
                        </div>

                        <div className={style.userInfo}>
                            <p className={style.userName}>{user?.nombreCompleto ?? 'Admin'}</p>
                            <p className={style.userEmail}>{user?.email ?? 'admin@centinela.com'}</p>
                        </div>

                        <ChevronDown
                            className={`${style.userTriggerIcon} ${isUserMenuOpen ? 'rotate-180' : ''}`}
                            aria-hidden="true"
                        />
                    </button>

                    {/* MENÚ DESPLEGABLE */}
                    {isUserMenuOpen && (
                        <div className={style.dropdownContainer}>
                            <div className={style.dropdownHeader}>
                                <p className={style.userName}>{user?.nombreCompleto ?? 'Admin'}</p>
                                <p className={style.userEmail}>{user?.rol ?? 'Administrador'}</p>
                            </div>

                            <button type="button" className={style.dropdownActionBtn} onClick={() => setIsUserMenuOpen(false)}>
                                <UserRound className="size-4" aria-hidden="true" /> Cuenta
                            </button>

                            <button type="button" className={style.dropdownActionBtn} onClick={() => setIsUserMenuOpen(false)}>
                                <Bell className="size-4" aria-hidden="true" /> Notificaciones
                            </button>

                            <button type="button" className={style.dropdownActionBtn} onClick={() => setIsUserMenuOpen(false)}>
                                <Circle className="size-4" aria-hidden="true" /> Estado
                            </button>

                            <div className={style.dropdownDivider} />

                            <button
                                type="button"
                                className={style.dropdownActionBtn}
                                onClick={() => { setIsUserMenuOpen(false); logout(); }}
                                disabled={isLoggingOut}
                            >
                                <LogOut className="size-4" aria-hidden="true" />
                                {isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}
                            </button>
                        </div>
                    )}
                </div>
            </SidebarFooter>
        </SidebarShell>
    );
}

// COMPONENTE DE NAVEGACIÓN
function NavigationItem({ to, label, icon: Icon, end = false }: { to: string; label: string; icon: typeof LayoutGrid; end?: boolean; }) {
    return (
        <SidebarMenuButton
            tooltip={label}
            render={
                <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) => isActive ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground' : undefined}
                />
            }
        >
            <Icon aria-hidden="true" />
            <span>{label}</span>
        </SidebarMenuButton>
    );
}

// OBJETO DE ESTILOS (Limpia)
const style = {
    // Estructura general
    sidebar: 'border-r border-sidebar-border bg-sidebar text-sidebar-foreground',
    header: 'border-b border-sidebar-border px-4 py-4 group-data-[collapsible=icon]:px-2',
    headerContent: 'flex items-center gap-3 group-data-[collapsible=icon]:justify-center',
    footer: 'border-t border-sidebar-border p-3 group-data-[collapsible=icon]:p-2',

    // Logo
    logoContainer: 'flex aspect-square size-15 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm',
    logoImage: 'h-full w-full object-cover',
    logoTextContainer: 'leading-tight group-data-[collapsible=icon]:hidden',
    logoTitle: 'text-lg font-semibold text-sidebar-foreground',
    logoSubtitle: 'text-xs text-sidebar-foreground/70',

    // Tarjeta Proxmox
    proxmoxCard: 'mt-auto rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-4 group-data-[collapsible=icon]:hidden',
    proxmoxHeader: 'mb-3 flex items-center gap-2',
    proxmoxDot: 'h-2.5 w-2.5 rounded-full bg-emerald-500',
    proxmoxTitle: 'text-sm font-semibold text-sidebar-foreground',
    proxmoxBadge: 'ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700',
    proxmoxBody: 'text-xs text-sidebar-foreground/70',
    proxmoxLabel: 'mb-1',
    proxmoxValue: 'font-medium text-sidebar-foreground',

    // Botón de Usuario (Trigger)
    userTriggerBtn: 'flex w-full items-center gap-3 rounded-xl border border-sidebar-border bg-background px-2.5 py-2.5 text-left shadow-sm transition-colors hover:bg-sidebar-accent/60 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:shadow-none',
    userAvatar: 'flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground',
    userInfo: 'min-w-0 flex-1 group-data-[collapsible=icon]:hidden',
    userName: 'truncate text-sm font-semibold text-foreground',
    userEmail: 'truncate text-xs text-muted-foreground',
    userTriggerIcon: 'size-4 shrink-0 text-muted-foreground transition-transform group-data-[collapsible=icon]:hidden',

    // Menú Desplegable de Usuario (Dropdown)
    dropdownContainer: 'absolute bottom-full left-0 right-0 z-20 mb-2 rounded-xl border border-border bg-background p-1.5 text-foreground shadow-lg ring-1 ring-border/60',
    dropdownHeader: 'border-b border-border px-2.5 py-2.5',
    dropdownActionBtn: 'flex w-full items-center justify-start gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
    dropdownDivider: 'my-1 border-t border-border',
};