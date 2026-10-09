import { useState } from 'react';
import { isUserEmailConflict, userEmailConflictMessage } from '../../users/utils/userAccountMessages';
import { createUser } from '../services/createUserService';
import { toast } from '@/components/ui/toast';
import { ApiRequestError } from '@/services/apiClient';
import type { CreateUserPayload } from '../types/createUser';

export function useCreateUser() {
  const [emailError, setEmailError] = useState<string | undefined>();
  async function submitNewUser(data: CreateUserPayload): Promise<boolean> {
    setEmailError(undefined);
    try {
      await createUser(data);
      toast.add({
        title: 'Usuario creado exitosamente',
        description: 'Usuario creado exitosamente. La contraseña temporal ha sido enviada por correo electrónico al usuario.',
        type: 'success',
      });
      return true;
    } catch (error) {
      const isDuplicatedUser = error instanceof ApiRequestError && error.status === 409;
      const isEmailDeliveryFailure = error instanceof ApiRequestError
        && error.status === 502
        && error.errorCode === 'EMAIL_DELIVERY_FAILED';

      if (isUserEmailConflict(error)) {
        setEmailError(userEmailConflictMessage);
        toast.add({ title: 'Correo en uso', description: userEmailConflictMessage, type: 'warning' });
      } else if (isDuplicatedUser) {
        toast.add({
          title: 'Datos ya registrados',
          description: error.errorCode === 'USER_USERNAME_ALREADY_EXISTS'
            ? 'El nombre de usuario ya se encuentra en uso.'
            : error.message,
          type: 'warning',
          priority: 'high',
          data: { forceExpanded: true },
        });
      } else if (!(error instanceof ApiRequestError && [401, 403].includes(error.status))) {
        toast.add({
          title: 'No se creó el usuario',
          description: isEmailDeliveryFailure ? error.message : 'No se pudo completar la creación del usuario.',
          type: 'error',
          priority: 'high',
        });
      }

      return false;
    }
  }
  return { submitNewUser, emailError, clearEmailError: () => setEmailError(undefined) };
}
