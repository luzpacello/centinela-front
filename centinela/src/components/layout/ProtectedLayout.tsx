import { Outlet, useLoaderData } from 'react-router';
import MainLayout from './MainLayout';
import { EventsProvider } from '@/context/EventsContext';
import { AlertsProvider } from '@/context/AlertsContext';
import NotificationBell from '@/components/features/notifications/NotificationBell';
import { PendingInstanceCreationsProvider } from '@/components/features/instances/context/PendingInstanceCreationsContext';
import type { UserSession } from '@/components/features/auth/types/authentication';

// Raíz protegida: garantiza sesión activa y muestra el usuario logueado + logout.
// El EventsProvider envuelve al Outlet para que el canal de eventos sea único y
// viva mientras haya sesión.
export default function ProtectedLayout() {
  const { user } = useLoaderData() as { user: UserSession };

  return (
    <MainLayout user={user}>
      <EventsProvider>
        <AlertsProvider>
          <NotificationBell />
          <PendingInstanceCreationsProvider>
            <Outlet />
          </PendingInstanceCreationsProvider>
        </AlertsProvider>
      </EventsProvider>
    </MainLayout>
  );
}
