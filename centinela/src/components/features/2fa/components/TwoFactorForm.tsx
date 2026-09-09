import React, { useState } from 'react';
import { twoFactorService } from '../services/2fa.service';
import { Button } from '@/components/ui/button';
import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Loader2 } from 'lucide-react';

interface TwoFactorFormProps {
  onSuccess?: () => void;
}

export const TwoFactorForm: React.FC<TwoFactorFormProps> = ({ onSuccess }) => {
  // Estado local manejado directamente en el componente
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length < 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await twoFactorService.verifyCode({ code });
      if (response.success) {
        if (onSuccess) onSuccess();
      } else {
        setError(response.message || 'Error al verificar el código');
      }
    } catch (err) {
      setError('Ocurrió un error inesperado. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError(null);
    try {
      await twoFactorService.resendCode();
    } catch (err) {
      setError('Error al reenviar el código.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6 w-full">
      <div className="flex flex-col items-center gap-2">
        <InputOTP
          maxLength={6}
          value={code}
          onChange={(value) => setCode(value)}
          pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
        >
          <InputOTPGroup className="gap-2">
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>

        {error && <p className="text-sm text-destructive font-medium mt-2">{error}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading || code.length < 6}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Verificar código
      </Button>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">¿No recibiste el código? </span>
        <Button
          type="button"
          variant="link"
          className="p-0 h-auto font-normal"
          onClick={handleResend}
          disabled={isResending}
        >
          {isResending ? 'Reenviando...' : 'Reenviar'}
        </Button>
      </div>
    </form>
  );
};