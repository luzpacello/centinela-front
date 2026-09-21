import { Outlet, redirect, type RouteObject } from 'react-router';
import MainLayoutAuth from '@/components/layout_auth/MainLayoutAuth';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import LoginPage from '@/pages/Login';
import DashboardPage from '@/pages/Dashboard.jsx';
import InstancesPage from '@/pages/Instances.jsx';
import UsersPage from '@/pages/Users';
import NotFoundPage from '@/pages/NotFound.jsx';
import { TwoFactorPage } from '@/pages/TwoFactor';
import { LoginContinuation } from '@/components/features/auth/components/LoginContinuation';
import { clearPendingLoginLoader, loadPendingTwoFactorSession, submitLoginAction, submitOrganizationRegistrationAction } from '@/components/features/auth/routes/authenticationActions';
import { loadAdminSession, loadProtectedSession } from '@/components/features/auth/routes/sessionGuard';
import { RouteErrorPage } from './RouteErrorPage';
import CrearUsuariosPage from '@/pages/CrearUsuarios';
import SignUpPage from '@/pages/SignUp';
import UserDetailPage from '@/pages/UserDetail';
import AuditoriaPage from '@/pages/Auditoria';
import RecoverPasswordPage from '@/pages/RecoverPassword';

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
          { path: '/two-factor/setup', Component: LoginContinuation, loader: loadPendingTwoFactorSession },
          { path: '/two-factor/verify', Component: LoginContinuation, loader: loadPendingTwoFactorSession },
          // Conserva la página existente como prototipo de diseño; el login real no navega aquí.
          { path: '/two-factor', element: <div><p role="note" className="mb-4 rounded-lg bg-amber-50 p-3">Vista de diseño de 2FA con datos de ejemplo.</p><TwoFactorPage /></div> },
        ],
      },
      {
        loader: loadProtectedSession,
        element: <ProtectedLayout />,
        children: [
          { index: true, loader: () => redirect('/dashboard') },
          { path: '/dashboard', Component: DashboardPage },
          { path: '/instances', Component: InstancesPage },
          { path: '/auditoria', Component: AuditoriaPage, loader: loadAdminSession },
          { path: '/users', Component: UsersPage, loader: loadAdminSession },
          { path: '/users/new', Component: CrearUsuariosPage, loader: loadAdminSession },
          { path: '/users/:userId', Component: UserDetailPage, loader: loadAdminSession },
        ],
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
];
