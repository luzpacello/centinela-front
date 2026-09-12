import { Outlet, redirect, type RouteObject } from 'react-router';
import MainLayout from '@/components/layout/MainLayout';
import MainLayoutAuth from '@/components/layout_auth/MainLayoutAuth';
import LoginPage from '@/pages/Login';
import SignUpPage from '@/pages/SignUp';
import DashboardPage from '@/pages/Dashboard.jsx';
import InstancesPage from '@/pages/Instances.jsx';
import NotFoundPage from '@/pages/NotFound.jsx';
import CreateUsersPage from '@/pages/CrearUsuarios';
import ComponentPlayground from '@/pages/ComponentPlayground';
import { TwoFactorPage } from '@/pages/TwoFactor';
import { LoginContinuation } from '@/components/features/auth/components/LoginContinuation';
import { clearPendingLoginLoader, loadPendingTwoFactorSession, submitLoginAction, submitOrganizationRegistrationAction } from '@/components/features/auth/routes/authenticationActions';
import { RouteErrorPage } from './RouteErrorPage';

// Las páginas de gestión son vistas sin conexión a datos. Su autorización requiere el contrato de sesión definitiva.
export const applicationRoutes: RouteObject[] = [
  {
    element: <Outlet />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, loader: () => redirect('/login') },
      {
        element: <MainLayoutAuth><div className="flex min-h-full items-center justify-center"><Outlet /></div></MainLayoutAuth>,
        children: [
          { path: '/login', Component: LoginPage, loader: clearPendingLoginLoader, action: submitLoginAction },
          { path: '/signup', Component: SignUpPage, loader: clearPendingLoginLoader, action: submitOrganizationRegistrationAction },
          { path: '/two-factor/setup', Component: LoginContinuation, loader: loadPendingTwoFactorSession },
          { path: '/two-factor/verify', Component: LoginContinuation, loader: loadPendingTwoFactorSession },
          // Conserva la página existente como prototipo; el login real nunca navega a esta simulación.
          { path: '/two-factor', element: <div><p role="note" className="mb-4 rounded-lg bg-amber-50 p-3">Vista de diseño de 2FA con datos de ejemplo.</p><TwoFactorPage /></div> },
        ],
      },
      {
        element: <MainLayout><Outlet /></MainLayout>,
        children: [
          { path: '/dashboard', Component: DashboardPage },
          { path: '/instances', Component: InstancesPage },
          { path: '/users/new', Component: CreateUsersPage },
          { path: '/components', Component: ComponentPlayground },
        ],
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
];
