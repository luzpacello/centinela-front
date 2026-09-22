import { useState } from 'react';
import { ChevronDown, LogOut, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserSession } from '@/components/features/auth/types/authentication';
import { useLogout } from '@/components/features/auth/hooks/useAuth';

export default function Header({ user }: { user?: UserSession }) {
    const [isOpen, setIsOpen] = useState(false);
    const { isLoggingOut, logout } = useLogout();

    const primerNombre = user?.nombreCompleto?.split(' ')[0] ?? 'Admin';

    return (
        <header className={style.header}>
            <div className={style.profileContainer}>
                {/* Botón trigger: Ahora solo tiene el avatar y la flecha */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={style.triggerButton}
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                >
                    <div className={style.avatar}>
                        {primerNombre.charAt(0).toUpperCase()}
                    </div>
                    <ChevronDown className={`${style.arrowIcon} ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <>
                        <div
                            className={style.backdrop}
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
            </div>
        </header>
    );
}

const style = {
    header: 'sticky top-0 z-10 flex h-16 w-full shrink-0 items-center justify-end bg-slate-50/40 px-6 backdrop-blur-md border-b border-white/30',
    profileContainer: 'relative',

    // Ajusté un poquito el padding (p-1.5 pr-2) para que la cápsula quede más redondita y simétrica al no tener texto
    triggerButton: 'flex items-center gap-1.5 rounded-full border border-white/50 bg-white/80 p-1.5 pr-2 shadow-sm backdrop-blur-sm transition-all hover:border-slate-300 hover:bg-white hover:shadow-md focus:outline-none',

    // Volvemos al avatar azul sólido, y lo hice apenitas más grande (h-8 w-8) para que tenga buena presencia
    avatar: 'flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white',

    arrowIcon: 'size-4 text-slate-400 transition-transform duration-200',
    backdrop: 'fixed inset-0 z-10',
    dropdownCard: 'absolute right-0 top-12 z-20 w-56 rounded-xl border border-white/60 bg-white/95 p-1.5 shadow-xl ring-1 ring-black/5 backdrop-blur-md',
    userInfoSection: 'mb-1 flex flex-col gap-1 rounded-lg bg-slate-50/60 px-3 py-2.5',
    userNameRow: 'flex items-center gap-2',
    userRoleRow: 'flex items-center gap-1.5',
    divider: 'my-1 border-t border-slate-100',
    actionSection: 'p-0.5',
    logoutButton: 'flex w-full items-center justify-start gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 active:bg-blue-50 active:text-blue-800',
    logoutIcon: 'size-4',
};