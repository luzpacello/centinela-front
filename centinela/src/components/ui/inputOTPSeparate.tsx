import React, { useState } from 'react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { REGEXP_ONLY_DIGITS } from 'input-otp';

export const SeparateOTPInput = () => {
  const [code, setCode] = useState('');

  return (
    <InputOTP
      maxLength={6}
      value={code}
      onChange={(value) => setCode(value)}
      pattern={REGEXP_ONLY_DIGITS}
    >
      {/* 
        Contenedor flex con separación (gap) entre cada casillero.
        Al poner cada InputOTPSlot en su propio InputOTPGroup, 
        cada casilla tiene sus 4 bordes redondeados independientes.
      */}
      <div className="flex items-center gap-2">
        <InputOTPGroup>
          <InputOTPSlot index={0} />
        </InputOTPGroup>
        <InputOTPGroup>
          <InputOTPSlot index={1} />
        </InputOTPGroup>
        <InputOTPGroup>
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPGroup>
          <InputOTPSlot index={3} />
        </InputOTPGroup>
        <InputOTPGroup>
          <InputOTPSlot index={4} />
        </InputOTPGroup>
        <InputOTPGroup>
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </div>
    </InputOTP>
  );
};