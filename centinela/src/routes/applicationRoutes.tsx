import { Outlet, redirect, type RouteObject } from 'react-router';
import MainLayoutAuth from '@/components/layout_auth/MainLayoutAuth';
import ProtectedLayout from '@/components/layout/ProtectedLayout';
import LoginPage from '@/pages/Login';
import DashboardPage from '@/pages/Dashboard.jsx';
import InstancesPage from '@/pages/Instances.jsx';
import NotFoundPage from '@/pages/NotFound.jsx';
import { TwoFactorPage } from '@/pages/TwoFactor';
import { LoginContinuation } from '@/components/features/auth/components/LoginContinuation';
import { clearPendingLoginLoader, loadPendingTwoFactorSession, submitLoginAction } from '@/components/features/auth/routes/authenticationActions';
import { loadProtectedSession } from '@/components/features/auth/routes/sessionGuard';
import { RouteErrorPage } from './RouteErrorPage';

export const applicationRoutes: RouteObject[] = [
  {
    element: <Outlet />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <MainLayoutAuth><div className="flex min-h-full items-center justify-center"><Outlet /></div></MainLayoutAuth>,
        children: [
          { path: '/login', Component: LoginPage, loader: clearPendingLoginLoader, action: submitLoginAction },
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
        ],
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
];
