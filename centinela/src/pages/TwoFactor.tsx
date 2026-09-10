/*import React from 'react';
import { TwoFactorForm } from '@/components/features/2fa/components/TwoFactorForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

export const TwoFactorPage: React.FC = () => {
  const handleSuccess = () => {
    console.log('Autenticación exitosa');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Verificación de dos factores</CardTitle>
          <CardDescription>
            Ingresa el código de 6 dígitos enviado a tu aplicación o correo electrónico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TwoFactorForm onSuccess={handleSuccess} />
        </CardContent>
      </Card>
    </div>
  );
};*/
import React, { useState } from 'react';
import { Stepper } from '@/components/ui/stepper';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { ContainerCard, InfoCard } from '@/components/ui/card';
import { SeparateOTPInput } from '@/components/ui/inputOTPSeparate'; 
import { CodeDisplay } from '@/components/features/2fa/components/CodeDisplay';
import { TwoFactorForm } from '@/components/features/2fa/components/TwoFactorForm';
/*<Lock color="#10b981" /> */
export const TwoFactorPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);

  // Arreglo con los títulos de los pasos
  const steps = [
    'Escanea código QR',
    'Verificar código',
    'Códigos de respaldo'
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const code = 'J3XK7Y4P9Q2M6V8L';

  return (
    <ContainerCard>
      <div className="max-w-2xl mx-auto space-y-2">
      <div className='flex flex-col items-center'>
        <span className='bg-blue-100 p-2 rounded-4xl' ><Lock color="#1075b9ff" size={30}/></span>
        <h1>Configuración incial de 2FA</h1>
        <p className='text-muted-foreground text-sm'>Seguí estos pasos para activar la autentifiación de dos factores y proteget tu cuenta</p>
      </div>
      {/* Componente de pasos en la parte superior */}
      <Stepper steps={steps} currentStep={currentStep} />

      {/* Contenido dinámico según el paso */}
      <div>
        {currentStep === 1 && (
          <div>
            <h2 className="text-lg font-bold mb-2">1. Escaneá el código QR con tu aplicación de autentificación</h2>
            <p className="text-muted-foreground text-sm">Usá Google Authenticator, Microsoft Authenticator, Authy o cualquier app compatible.</p>
            <div className='flex justify-around my-4'>
              {/* QR renderizado */}
              <div className='p-12 my-1 bg-gray-100'><span>QR</span></div>
              {/* Código de ingreso manual */}
              <div className='p-4 rounded-lg border flex gap-3 shadow-sm'>
                <div className="flex-1 space-y-1">
                  <h4 className="font-semibold text-sm text-blue-600">¿No podes escanear?</h4>
                  <div className="text-muted-foreground text-sm">Ingresá este código manualmente en tu aplicación:</div>
                  <CodeDisplay code={code}/>
                </div>
              </div>
            </div>
            <InfoCard>
                <p>Este código es único para tu cuenta y cambiará si lo generás nuevamente</p>
            </InfoCard>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <h2 className="text-lg font-bold mb-2">2. Validar codigo</h2>
            <p className="text-muted-foreground text-sm">Ingresá el código de 6 digitos de tu aplicación de autentificación.</p>
            <div className="flex flex-col gap-4 w-full mt-4">
              <TwoFactorForm/>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <h2 className="text-lg font-bold mb-2">3. Guardar códigos</h2>
            <p className="text-muted-foreground text-sm">Anotá o descarga los codigos de respaldo</p>
              {/* Códigos */}
              <div className='grid grid-cols-3 gap-4 p-4 rounded-lg border shadow-sm my-4'>
                  <CodeDisplay code={code}/>
                  <CodeDisplay code={code}/>
                  <CodeDisplay code={code}/>
                  <CodeDisplay code={code}/>
                  <CodeDisplay code={code}/>
                  <CodeDisplay code={code}/>
              </div>
            <p className='text-blue-400 text-end'>descargar</p>
          </div>
        )}
      </div>

      {/* Botones para navegar entre pasos */}
      <div className="flex justify-between mt-2">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentStep === 1}
        >
          Anterior
        </Button>
        <Button
          onClick={handleNext}
          disabled={currentStep === steps.length}
        >
          Siguiente
        </Button>
      </div>
    </div>
  </ContainerCard>
    
  );
}; 