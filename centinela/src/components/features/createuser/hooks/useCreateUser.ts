import { createUser, type CreateUserPayload } from '../services/createUserService';
import { toast } from '@/components/ui/toast';
import { ApiRequestError } from '@/services/apiClient';

export function useCreateUser() {
  async function submitNewUser(data: CreateUserPayload): Promise<boolean> {
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

      toast.add({
        title: 'No se creó el usuario',
        description: 'No se pudo completar la creación del usuario.',
        type: 'error',
        priority: 'high',
        data: isDuplicatedUser ? { forceExpanded: true } : undefined,
      });

      if (isDuplicatedUser) {
        const errorMessage = error.message.toLocaleLowerCase();
        const duplicatedFieldMessage = errorMessage.includes('mail') || errorMessage.includes('correo')
          ? 'El correo electrónico ya existe o está siendo utilizado.'
          : errorMessage.includes('username') || errorMessage.includes('usuario')
            ? 'El nombre de usuario ya existe o está siendo utilizado.'
            : 'El correo electrónico o el nombre de usuario ya está siendo utilizado.';

        toast.add({
          title: 'Datos ya registrados',
          description: duplicatedFieldMessage,
          type: 'warning',
          priority: 'high',
          data: { forceExpanded: true },
        });
      }

      return false;
    }
  }
  return { submitNewUser };
}
