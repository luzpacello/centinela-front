import { useEffect, useState } from 'react';
import { twoFactorService } from '../services/2fa.service';
import type { LoginResponse, TwoFactorSetupResponse } from '@/components/features/auth/types/authentication';
import { mapAuthenticationError } from '@/components/features/auth/utils/mapAuthenticationError';

/**
 * Orquesta el flujo 2FA contra el backend real.
 * - Si `requiresSetup` es true, pide /auth/2fa/setup al montar y reemplaza el challenge
 *   por el que devuelve el setup (el backend genera uno nuevo con propósito de verificación).
 * - `verify` confirma el código TOTP y devuelve la sesión con tokens.
 */
export function use2FA(initialChallengeToken: string, requiresSetup: boolean) {
  const [challengeToken, setChallengeToken] = useState(initialChallengeToken);
  const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(null);
  const [isPreparingSetup, setIsPreparingSetup] = useState(requiresSetup);
  const [setupError, setSetupError] = useState<string | null>(null);

  useEffect(() => {
    if (!requiresSetup || !initialChallengeToken) {
      setIsPreparingSetup(false);
      return;
    }
    let cancelled = false;
    setIsPreparingSetup(true);
    setSetupError(null);
    twoFactorService.setup(initialChallengeToken)
      .then((data) => {
        if (cancelled) return;
        setSetupData(data);
        setChallengeToken(data.challengeToken);
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
  }, [initialChallengeToken, requiresSetup]);

  function verify(code: string): Promise<LoginResponse> {
    return twoFactorService.verify(challengeToken, code);
  }

  return { challengeToken, setupData, isPreparingSetup, setupError, verify };
}
