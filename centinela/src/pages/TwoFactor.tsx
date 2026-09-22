import React, { useState } from 'react';
import { Stepper } from '@/components/ui/stepper';
import { Button } from '@/components/ui/button';
import { Lock, MoveRight } from 'lucide-react';
import { ContainerCard, InfoCard } from '@/components/ui/card';
import { CodeDisplay } from '@/components/features/2fa/components/CodeDisplay';
import { CopySecretSection } from '@/components/features/2fa/components/CopySecretSection';
import { TwoFactorForm } from '@/components/features/2fa/components/TwoFactorForm';
import { Link, useLoaderData, useLocation, useNavigate } from 'react-router';
import type { LoginResponse } from '@/components/features/auth/types/authentication';
import { clearPendingLoginSession } from '@/storage/tokenStorage';
import { persistSessionFromTokens } from '@/components/features/auth/services/authService';
import { mapAuthenticationError } from '@/components/features/auth/utils/mapAuthenticationError';
import { use2FA } from '@/components/features/2fa/hooks/use2FA';
import { toast } from '@/components/ui/toast';

export const TwoFactorPage: React.FC = () => {
  const pendingSession = useLoaderData<LoginResponse>();
  const location = useLocation();
  const navigate = useNavigate();
  const requiresSetup = location.pathname === '/two-factor/setup';
  const { qrData, isPreparingSetup, setupError, verify } = use2FA(pendingSession.jwtTemporal, requiresSetup);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  async function handleSubmit(code:string) {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const tokens = await verify(code);
      await persistSessionFromTokens(tokens);
      clearPendingLoginSession();
      navigate('/dashboard', { replace: true });
    } catch(error) {
      const errorMessage = mapAuthenticationError(error, 'twoFactor').message ?? 'No se pudo verificar el código.';
      setSubmitError(errorMessage);
      toast.add({
        title: 'Error de verificación',
        description: errorMessage,
        type: 'error',
        priority: 'high',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (setupError) {
    return (
      <ContainerCard className='px-10 min-h-[640px] flex flex-col items-center justify-center'>
        <section className="w-full max-w-xl space-y-5 rounded-xl border bg-white p-8 text-center shadow-sm">
          <h1>No se pudo iniciar la configuración</h1>
          <p role="alert" className="text-destructive">{setupError}</p>
          <Link to="/login" replace onClick={clearPendingLoginSession} className="text-info underline">Volver al inicio de sesión</Link>
        </section>
      </ContainerCard>
    );
  }
  // Arreglo con los títulos de los pasos
  const steps = [ 'Escanea código QR', 'Verificar código' ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  return (
    <ContainerCard className='px-10 min-h-[640px]'>
      <div className="max-w-2xl mx-auto space-y-2 w-full">
        {/* cabecra */}
        <div className='flex flex-col items-center'>
          <span className='flex h-20 w-20 items-center justify-center self-center rounded-full bg-[#bfdbfe]'> <Lock aria-hidden="true" className="size-12 text-[#2563eb]" strokeWidth={1.75} /></span>
        </div>

        {/* /two-factor/setup */}
        {requiresSetup && (
          <div>
            <div className='flex flex-col items-center'>
              <h1>Configuración inicial de 2FA</h1>
              <p className='text-muted-foreground text-sm'>Seguí estos pasos para activar la autenticación de dos factores y proteger tu cuenta</p>
            </div>
            
            <Stepper steps={steps} currentStep={currentStep} />
            
            <div className="mt-4">
              {/* Paso 1: Escanear Código QR condicionado por isPreparingSetup y qrData */}
              {currentStep === 1 && (
                <div>
                  <h2 className="text-lg font-bold mb-2">1. Escaneá el código QR con tu aplicación de autentificación</h2>
                  <p className="text-muted-foreground text-sm">Usá Google Authenticator, Microsoft Authenticator, Authy o cualquier app compatible.</p>

                  <div className="flex flex-col items-center gap-4 my-4">
                    {isPreparingSetup && <p role="status">Generando código de vinculación…</p>}
                    
                    {qrData && (
                      <div className='flex justify-around items-center w-full flex-wrap gap-4'>
                        <div className='my-1 bg-white border rounded-xl shadow-sm'>
                          <img src={qrData.qrBase64} alt="Código QR de configuración" width={176} height={176} />
                        </div>
                        <div className='p-4 rounded-lg border flex gap-3 shadow-sm'>
                          <div className="flex-1 space-y-1">
                            <h4 className="font-semibold text-sm text-blue-600">¿No podés escanear?</h4>
                            <div className="text-muted-foreground text-sm">Ingresá este código manualmente en tu aplicación:</div>
                            <CodeDisplay code={qrData.secretoManual} />
                            <CopySecretSection code={qrData.secretoManual}/>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {qrData && (
                    <>
                      <InfoCard>
                        <p>Este código es único para tu cuenta y cambiará si lo generás nuevamente</p>
                      </InfoCard>
                      <div className='mt-4 flex justify-end'>
                        <Button 
                          onClick={handleNext}
                          disabled={currentStep === steps.length}
                        >
                          Continuar
                          <MoveRight color="#fff" size={20} />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Paso 2: Validar Código (Setup) */}
              {currentStep === 2 && (
                <div>
                  <h2 className="text-lg font-bold mb-2">2. Validar código</h2>
                  <p className="text-muted-foreground text-sm">Ingresá el código de 6 dígitos de tu aplicación de autentificación.</p>
                  <div className="flex flex-col gap-4 w-full mt-4">
                    <TwoFactorForm onSubmit={handleSubmit} isSubmitting={isSubmitting} error={submitError} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* /two-factor/verify */}
        {!requiresSetup && (
          <div>
            <div className='flex flex-col items-center'>
              <h1>Verificación de 2FA</h1>
              <p className='text-muted-foreground text-sm'>Ingresa el código de 6 digitos de tu aplicación de autentificación.</p>
            </div>
            <div>
              <div className="flex flex-col gap-4 w-full mt-4">
                <TwoFactorForm onSubmit={handleSubmit} isSubmitting={isSubmitting} error={submitError} />
              </div>
            </div>
            <div className='my-4 w-full h-full'>
              <Link 
                to="/login" 
                replace 
                onClick={clearPendingLoginSession}
                className='py-2 border rounded-xl text-center shadow-sm w-full h-full flex items-center justify-center'
              >
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        )}
      </div>
    </ContainerCard>
  );
};