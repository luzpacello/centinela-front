import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  user: {
    id: 'user-1',
    nombreCompleto: 'Belinda Test',
    nombreUsuario: 'belinda',
    emailUsuario: 'original@example.com',
    organizacionId: 'org-1',
    rol: 'ADMIN',
    activo: true,
    eliminadoEn: null,
    totpVinculado: true,
    cambioContrasenaRequerido: false,
    fechaCreacion: '2026-01-01T00:00:00Z',
    fechaUltimoAcceso: null,
    instanciasPermitidas: [],
  },
  requestAccountEmailChange: vi.fn(),
  updateUserDetails: vi.fn(),
  saveAssignments: vi.fn(),
  toastAdd: vi.fn(),
}));

vi.mock('@/components/features/users/hooks/useUserDetails', () => ({
  useUserDetails: () => ({ user: mocks.user, isLoading: false, errorMessage: null, retry: vi.fn() }),
}));

vi.mock('@/components/features/users/hooks/useUserInstanceAccess', () => ({
  useUserInstanceAccess: () => ({
    instances: [],
    assignedIds: [],
    pendingAccess: {},
    isLoading: false,
    saveAssignments: mocks.saveAssignments,
  }),
}));

vi.mock('@/components/features/users/hooks/useUserRecentActivity', () => ({
  useUserRecentActivity: () => ({ activity: [], isLoading: false, errorMessage: null }),
}));

vi.mock('@/components/features/users/services/userDetailsService', () => ({
  requestAccountEmailChange: mocks.requestAccountEmailChange,
  updateUserDetails: mocks.updateUserDetails,
}));

vi.mock('@/components/features/users/services/userDeactivationService', () => ({
  deleteUserAccount: vi.fn(),
}));

vi.mock('@/components/ui/toast', () => ({
  toast: { add: mocks.toastAdd },
}));

vi.mock('@/components/common/ApiResponseNotifier', () => ({ ApiResponseNotifier: () => null }));
vi.mock('@/context/PermissionGate', () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ isAdmin: () => true }),
}));

import DetailsUserPage from '@/pages/detailsUserPage';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
});

describe('DetailsUserPage email reauthentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requestAccountEmailChange.mockResolvedValue(undefined);
    mocks.updateUserDetails.mockResolvedValue(mocks.user);
  });

  it('requires reauthentication, submits the profile request, and keeps the original email displayed', async () => {
    render(
      <MemoryRouter initialEntries={[{
        pathname: '/users/user-1',
        state: { isCurrentUser: true },
      }]}>
        <Routes>
          <Route path="/users/:userId" element={<DetailsUserPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const emailInput = screen.getByLabelText('Correo electrónico');
    fireEvent.change(emailInput, { target: { value: 'nuevo@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByRole('dialog', { name: 'Confirmá tu identidad' })).toBeInTheDocument();
    expect(mocks.requestAccountEmailChange).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value: 'clave-actual' } });
    fireEvent.change(screen.getByLabelText('Código de autenticación (2FA)'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar cambio' }));

    await waitFor(() => expect(mocks.requestAccountEmailChange).toHaveBeenCalledWith(
      'nuevo@example.com',
      'clave-actual',
      '123456',
    ));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Solicitud procesada. Enviamos un enlace de verificación a tu nueva dirección de correo para confirmar el cambio.',
    );
    expect(emailInput).toHaveValue('original@example.com');
    expect(mocks.updateUserDetails).not.toHaveBeenCalled();
  }, 15000);
});
