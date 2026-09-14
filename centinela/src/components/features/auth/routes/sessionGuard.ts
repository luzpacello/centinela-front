import { redirect } from 'react-router';
import { getAccessToken, getStoredUserSession } from '@/services/api.js';

// Guard de rutas protegidas: sin token o sin perfil almacenado se vuelve al login.
export function loadProtectedSession() {
  const accessToken = getAccessToken();
  const user = getStoredUserSession();
  if (!accessToken || !user) return redirect('/login');
  return { user };
}
