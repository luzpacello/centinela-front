import { redirect } from 'react-router';
import { getAccessToken, getStoredUserSession } from '@/services/api.js';

function readSession() {
  const accessToken = getAccessToken();
  const user = getStoredUserSession();
  if (!accessToken || !user) return null;
  return user;
}

// Guard de rutas protegidas: sin token o sin perfil almacenado se vuelve al login.
export function loadProtectedSession() {
  const user = readSession();
  if (!user) return redirect('/login');
  return { user };
}

// Guard de rutas administrativas: solo ADMIN. Un OPERATOR vuelve al dashboard.
export function loadAdminSession() {
  const user = readSession();
  if (!user) return redirect('/login');
  if (user.rol !== 'ADMIN') return redirect('/dashboard');
  return { user };
}

// Guard de la pantalla de cambio obligatorio: solo exige token de acceso.
// No consulta el perfil a propósito, porque el backend lo bloquea con 403
// PASSWORD_CHANGE_REQUIRED justamente mientras el cambio está pendiente.
export function loadPasswordChangeSession() {
  if (!getAccessToken()) return redirect('/login');
  return null;
}
