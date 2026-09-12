import { Link, useLoaderData } from 'react-router';
import type { LoginResponse } from '../types/authentication';
import { clearPendingLoginSession } from '../services/pendingLoginSession';

export function LoginContinuation() {
  const pendingSession = useLoaderData<LoginResponse>();
  // El contrato disponible termina aquí. Nunca se llama al servicio 2FA simulado ni se concede acceso definitivo.
  return (
    <section className="w-full max-w-xl space-y-5 rounded-xl border bg-white p-8 text-center shadow-sm">
      <h1>Credenciales verificadas</h1>
      <p role="status">
        {pendingSession.require2faSetup
          ? 'Tu cuenta requiere configurar la autenticación de dos factores.'
          : 'Tu cuenta requiere ingresar el código de la aplicación autenticadora.'}
      </p>
      <p className="text-secundario">El paso de verificación todavía no está disponible. El inicio de sesión está pendiente de completarse.</p>
      <Link to="/login" replace onClick={clearPendingLoginSession} className="text-info underline">Volver al inicio de sesión</Link>
    </section>
  );
}
