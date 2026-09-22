import { Outlet, redirect, type RouteObject } from 'react-router';
import MainLayoutAuth from '@/components/layout_auth/MainLayoutAuth';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import LoginPage from '@/pages/Login';
import DashboardPage from '@/pages/Dashboard';
import InstancesPage from '@/pages/Instances';
import UsersPage from '@/pages/Users';
import NotFoundPage from '@/pages/NotFound';
import { TwoFactorPage } from '@/pages/TwoFactor';
import { clearPendingLoginLoader, loadPendingTwoFactorSession, submitLoginAction, submitOrganizationRegistrationAction } from '@/components/features/auth/routes/authenticationActions';
import { loadAdminSession, loadPasswordChangeSession, loadProtectedSession } from '@/components/features/auth/routes/sessionGuard';
import { RouteErrorPage } from './RouteErrorPage';
import CrearUsuariosPage from '@/pages/CrearUsuarios';
import SignUpPage from '@/pages/SignUp';
import UserDetailPage from '@/pages/UserDetail';
import AuditoriaPage from '@/pages/Auditoria';
import RecoverPasswordPage from '@/pages/RecoverPassword';
import ChangePasswordPage from '@/pages/ChangePassword';

export const applicationRoutes: RouteObject[] = [
  {
    element: <Outlet />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <MainLayoutAuth><div className="flex min-h-full items-center justify-center"><Outlet /></div></MainLayoutAuth>,
        children: [
          { path: '/login', Component: LoginPage, loader: clearPendingLoginLoader, action: submitLoginAction },
          { path: '/signup', Component: SignUpPage, loader: clearPendingLoginLoader, action: submitOrganizationRegistrationAction },
          { path: '/recover-password', Component: RecoverPasswordPage, loader: clearPendingLoginLoader },
          // Cambio obligatorio de contraseña temporal: exige token pero no perfil,
          // porque el backend bloquea el perfil con 403 en este estado.
          { path: '/change-password', Component: ChangePasswordPage, loader: loadPasswordChangeSession },
          { path: '/two-factor/setup', Component: TwoFactorPage, loader: loadPendingTwoFactorSession },
          { path: '/two-factor/verify', Component: TwoFactorPage, loader: loadPendingTwoFactorSession },
          // Conserva la página existente como prototipo de diseño; el login real no navega aquí.
          //{ path: '/two-factor', element: <div><p role="note" className="mb-4 rounded-lg bg-amber-50 p-3">Vista de diseño de 2FA con datos de ejemplo.</p><TwoFactorPage /></div> },
          //{ path: '/two-factor', Component: TwoFactorPage },
          // Rutas temporales de diseño: se pueden visualizar sin sesión ni backend.
          //{ path: '/dashboard', Component: DashboardPage },
        ],
      },
      {
        loader: loadProtectedSession,
        element: <ProtectedLayout />,
        children: [
          { index: true, loader: () => redirect('/dashboard') },
          { path: '/dashboard', Component: DashboardPage },
          { path: '/instances', Component: InstancesPage },
          { path: '/auditoria', Component: AuditoriaPage },
          {
            // Guard administrativo: un OPERATOR es redirigido al dashboard.
            loader: loadAdminSession,
            children: [
              { path: '/users', Component: UsersPage },
              { path: '/users/new', Component: CrearUsuariosPage },
              { path: '/users/:userId', Component: UserDetailPage },
            ],
          },
        ],
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
];
