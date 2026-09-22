import { Outlet, useLoaderData } from 'react-router';
import MainLayout from './MainLayout';
import type { UserSession } from '@/components/features/auth/types/authentication';

// Raíz protegida: garantiza sesión activa y muestra el usuario logueado + logout.
export default function ProtectedLayout() {
  const { user } = useLoaderData() as { user: UserSession };

  return (
    <MainLayout user={user}>
      <Outlet />
    </MainLayout>
  );
}
