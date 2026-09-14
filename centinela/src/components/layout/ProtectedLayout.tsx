import { Outlet, useLoaderData } from 'react-router';
import { LogOut } from 'lucide-react';
import MainLayout from './MainLayout';
import { Button } from '@/components/ui/button';
import type { UserSession } from '@/components/features/auth/types/authentication';
import { useLogout } from '@/components/features/auth/hooks/useAuth';

// Raíz protegida: garantiza sesión activa y muestra el usuario logueado + logout.
export default function ProtectedLayout() {
  const { user } = useLoaderData() as { user: UserSession };
  const { isLoggingOut, logout } = useLogout();

  return (
    <MainLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4">
        <div className="text-left">
          <p className="font-semibold text-gray-900">{user.nombreCompleto}</p>
          <p className="text-sm text-gray-500">{user.email} · {user.rol}</p>
        </div>
        <Button variant="outline" onClick={logout} disabled={isLoggingOut}>
          <LogOut className="mr-2 size-4" aria-hidden="true" />
          {isLoggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
        </Button>
      </div>
      <Outlet />
    </MainLayout>
  );
}
