import { useValidatedAuthenticationForm } from './useValidatedAuthenticationForm';
import { validateLoginFields } from '../utils/validateAuthenticationFields';
import type { LoginCredentials } from '../types/authentication';

export function useLogin(initialEmail = '') {
  return useValidatedAuthenticationForm<LoginCredentials>(
    { email: initialEmail, password: '', rememberMe: false }, validateLoginFields, '/login',
  );
}
