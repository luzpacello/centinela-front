import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { SecurityReauthModal } from '@/components/features/users/components/SecurityReauthModal';
import { ApiRequestError } from '@/services/apiClient';

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
});

describe('SecurityReauthModal', () => {
  it('requiere contraseña y un código 2FA de exactamente seis dígitos', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<SecurityReauthModal emailUsuario="nuevo@example.com" onConfirm={onConfirm} onCancel={vi.fn()} />);

    const submit = screen.getByRole('button', { name: 'Confirmar cambio' });
    const password = screen.getByLabelText('Contraseña actual');
    const code = screen.getByLabelText('Código de autenticación (2FA)');

    expect(screen.getByText(/nuevo@example\.com/)).toBeInTheDocument();
    expect(submit).toBeDisabled();

    await user.type(password, 'clave-actual');
    await user.type(code, '12a34');
    expect(code).toHaveValue('1234');
    expect(submit).toBeDisabled();

    await user.type(code, '56');
    expect(submit).toBeEnabled();
    await user.click(submit);

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith({
      contrasenaActual: 'clave-actual',
      codigo2fa: '123456',
    }));
  });

  it.each([
    ['AUTH_FAILED', 'La contraseña actual no es correcta.'],
    ['INVALID_OTP_CODE', 'El código de autenticación no es válido.'],
  ])('muestra el error %s dentro del modal', async (errorCode, message) => {
    const onConfirm = vi.fn().mockRejectedValue(new ApiRequestError('Unauthorized', 401, errorCode));
    const user = userEvent.setup();
    render(<SecurityReauthModal emailUsuario="nuevo@example.com" onConfirm={onConfirm} onCancel={vi.fn()} />);

    await user.type(screen.getByLabelText('Contraseña actual'), 'clave-actual');
    await user.type(screen.getByLabelText('Código de autenticación (2FA)'), '123456');
    await user.click(screen.getByRole('button', { name: 'Confirmar cambio' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
