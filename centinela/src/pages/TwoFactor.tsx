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

export const MultiStepFormPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);

  // Arreglo con los títulos de los pasos
  const steps = [
    'Datos Personales',
    'Verificación 2FA',
    'Confirmación'
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

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      {/* Componente de pasos en la parte superior */}
      <Stepper steps={steps} currentStep={currentStep} />

      {/* Contenido dinámico según el paso */}
      <div className="p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
        {currentStep === 1 && (
          <div>
            <h2 className="text-xl font-bold mb-2">Paso 1: Datos Personales</h2>
            <p className="text-muted-foreground text-sm">Ingresa tus datos de registro.</p>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <h2 className="text-xl font-bold mb-2">Paso 2: Verificación 2FA</h2>
            <p className="text-muted-foreground text-sm">Ingresa el código que recibiste.</p>
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <h2 className="text-xl font-bold mb-2">Paso 3: Confirmación</h2>
            <p className="text-muted-foreground text-sm">Revisa y confirma tu información.</p>
          </div>
        )}
      </div>

      {/* Botones para navegar entre pasos */}
      <div className="flex justify-between">
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
  );
}; 