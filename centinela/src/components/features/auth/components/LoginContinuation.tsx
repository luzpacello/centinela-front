import { useState } from 'react';
import { Link, useLoaderData, useLocation, useNavigate } from 'react-router';
import type { LoginResponse } from '../types/authentication';
import { clearPendingLoginSession } from '../services/pendingLoginSession';
import { persistSessionFromTokens } from '../services/authService';
import { mapAuthenticationError } from '../utils/mapAuthenticationError';
import { use2FA } from '@/components/features/2fa/hooks/use2FA';
import { TwoFactorForm } from '@/components/features/2fa/components/TwoFactorForm';
import { CodeDisplay } from '@/components/features/2fa/components/CodeDisplay';
import { InfoCard } from '@/components/ui/card';

export function LoginContinuation() {
  const pendingSession = useLoaderData<LoginResponse>();
  const location = useLocation();
  const navigate = useNavigate();
  const requiresSetup = location.pathname === '/two-factor/setup';
  const { qrData, isPreparingSetup, setupError, verify } = use2FA(pendingSession.jwtTemporal, requiresSetup);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(code: string) {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const tokens = await verify(code);
      // Guarda los tokens y trae el perfil: es la fuente de los datos del usuario.
      await persistSessionFromTokens(tokens);
      clearPendingLoginSession();
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setSubmitError(mapAuthenticationError(error, 'twoFactor').message ?? 'No se pudo verificar el código.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (setupError) {
    return (
      <section className="w-full max-w-xl space-y-5 rounded-xl border bg-white p-8 text-center shadow-sm">
        <h1>No se pudo iniciar la configuración</h1>
        <p role="alert" className="text-destructive">{setupError}</p>
        <Link to="/login" replace onClick={clearPendingLoginSession} className="text-info underline">Volver al inicio de sesión</Link>
      </section>
    );
  }

  return (
    <section className="w-full max-w-xl space-y-5 rounded-xl border bg-white p-8 text-center shadow-sm">
      <h1>{requiresSetup ? 'Configurá tu segundo factor' : 'Verificá tu identidad'}</h1>
      <p className="text-secundario">
        {requiresSetup
          ? 'Escaneá el código QR con tu aplicación autenticadora y luego ingresá el código de 6 dígitos.'
          : 'Ingresá el código de 6 dígitos de tu aplicación autenticadora.'}
      </p>

      {requiresSetup && (
        <div className="flex flex-col items-center gap-4">
          {isPreparingSetup && <p role="status">Generando código de vinculación…</p>}
          {qrData && (
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-lg border bg-white p-4">
                {/* El backend entrega la imagen del QR ya codificada como data URI PNG. */}
                <img src={qrData.qrBase64} alt="Código QR de configuración" width={176} height={176} />
              </div>
              <div className="w-full max-w-sm space-y-1 text-left">
                <p className="text-sm text-muted-foreground">¿No podés escanear? Ingresá este código manualmente:</p>
                <CodeDisplay code={qrData.secretoManual} />
              </div>
              <InfoCard>
                <p>Este código es único para tu cuenta. No lo compartas con nadie.</p>
              </InfoCard>
            </div>
          )}
        </div>
      )}

      {(!requiresSetup || qrData) && (
        <TwoFactorForm onSubmit={handleSubmit} isSubmitting={isSubmitting} error={submitError} />
      )}

      <Link to="/login" replace onClick={clearPendingLoginSession} className="text-info underline">Volver al inicio de sesión</Link>
    </section>
  );
}
