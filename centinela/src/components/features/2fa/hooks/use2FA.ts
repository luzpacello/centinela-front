import { useEffect, useState } from 'react';
import { twoFactorService } from '../services/2fa.service';
import type { TokenResponse, TwoFactorQrResponse } from '@/components/features/auth/types/authentication';
import { mapAuthenticationError } from '@/components/features/auth/utils/mapAuthenticationError';

/**
 * Orquesta el flujo 2FA contra el backend real.
 * - Si `requiresSetup` es true, pide GET /auth/2fa/qr al montar para mostrar el QR.
 * - `verify` confirma el código TOTP y devuelve los tokens de sesión.
 * El `jwtTemporal` que devolvió el login viaja en la cabecera en ambos pasos.
 */
export function use2FA(jwtTemporal: string, requiresSetup: boolean) {
  const [qrData, setQrData] = useState<TwoFactorQrResponse | null>(null);
  const [isPreparingSetup, setIsPreparingSetup] = useState(requiresSetup);
  const [setupError, setSetupError] = useState<string | null>(null);

  useEffect(() => {
    if (!requiresSetup || !jwtTemporal) {
      setIsPreparingSetup(false);
      return;
    }
    let cancelled = false;
    setIsPreparingSetup(true);
    setSetupError(null);
    twoFactorService.qr(jwtTemporal)
      .then((data) => {
        if (cancelled) return;
        setQrData(data);
      })
      .catch((error) => {
        if (cancelled) return;
        setSetupError(mapAuthenticationError(error, 'twoFactor').message ?? 'No se pudo iniciar la configuración de dos factores.');
      })
      .finally(() => {
        if (!cancelled) setIsPreparingSetup(false);
      });
    return () => {
      cancelled = true;
    };
  }, [jwtTemporal, requiresSetup]);

  function verify(code: string): Promise<TokenResponse> {
    return twoFactorService.verify(jwtTemporal, code);
  }

  return { qrData, isPreparingSetup, setupError, verify };
}
