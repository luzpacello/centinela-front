import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Loader2 } from 'lucide-react';

interface TwoFactorFormProps {
  /** Verifica el código TOTP contra el backend. Debe resolver si la verificación fue aceptada. */
  onSubmit: (code: string) => Promise<void>;
  isSubmitting: boolean;
  error?: string | null;
}

export const TwoFactorForm: React.FC<TwoFactorFormProps> = ({ onSubmit, isSubmitting, error }) => {
  const [code, setCode] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (code.length < 6 || isSubmitting) return;
    await onSubmit(code);
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

        {error && <p role="alert" className="text-sm text-destructive font-medium mt-2">{error}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting || code.length < 6}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Verificar código
      </Button>
    </form>
  );
};
