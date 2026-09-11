import React, { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Stepper } from '@/components/ui/stepper';

const steps = ['Solicitar', 'Verificar', 'Nueva contraseña'];

export const RecoverPassword: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const handleNext = () => {
        if (currentStep < steps.length) {
            setCurrentStep((previousStep) => previousStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep((previousStep) => previousStep - 1);
        }
    };

    const renderStep = () => {
        if (currentStep === 1) {
            return (
                <>
                    <div className={styles.icono}>
                        <Mail aria-hidden="true" className="size-12 text-[#2563eb]" strokeWidth={1.75} />
                    </div>
                    <h1>Recuperar contraseña</h1>
                    <p className="text-secundario">
                        Ingresá tu correo electrónico para recuperar el acceso a tu cuenta de Centinela.
                    </p>
                    <div className={styles.cardInformativa}>
                        <ShieldCheck aria-hidden="true" className="size-8 text-[#2563eb]" />
                        <label>Te enviaremos un código de verificación a tu correo electrónico.</label>
                    </div>
                    <form className={styles.formulario} onSubmit={(event) => { event.preventDefault(); handleNext(); }}>
                        <div className={styles.campo}>
                            <label htmlFor="recover-email">Correo electrónico</label>
                            <Input
                                id="recover-email"
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="Ej: juan@ejemplo.com"
                            />
                        </div>
                        <Button type="submit" className="w-full">Enviar código de recuperación</Button>
                    </form>
                </>
            );
        }

        if (currentStep === 2) {
            return (
                <>
                    <div className={styles.icono}>
                        <ShieldCheck aria-hidden="true" className="size-12 text-[#2563eb]" strokeWidth={1.75} />
                    </div>
                    <h1>Verificación de identidad</h1>
                    <p className="text-secundario">
                        Ingresá el código de 6 dígitos enviado a {email || 'tu correo electrónico'}.
                    </p>
                    <form className={styles.formulario} onSubmit={(event) => { event.preventDefault(); handleNext(); }}>
                        <div className={styles.campo}>
                            <label htmlFor="recover-code">Código de verificación</label>
                            <InputOTP
                                id="recover-code"
                                maxLength={6}
                                value={code}
                                onChange={(value: string) => setCode(value)}
                            >
                                <InputOTPGroup className="w-full justify-between">
                                    <InputOTPSlot index={0} />
                                    <InputOTPSlot index={1} />
                                    <InputOTPSlot index={2} />
                                    <InputOTPSlot index={3} />
                                    <InputOTPSlot index={4} />
                                    <InputOTPSlot index={5} />
                                </InputOTPGroup>
                            </InputOTP>
                            <p className="text-caption">El código es válido durante 10 minutos.</p>
                        </div>
                        <Button type="submit" className="w-full">Verificar código</Button>
                        <Button type="button" variant="link" onClick={() => setCurrentStep(1)}>
                            Reenviar código
                        </Button>
                    </form>
                </>
            );
        }

        return (
            <>
                <div className={styles.icono}>
                    <LockKeyhole aria-hidden="true" className="size-12 text-[#2563eb]" strokeWidth={1.75} />
                </div>
                <h1>Nueva contraseña</h1>
                <p className="text-secundario">
                    Creá una nueva contraseña para volver a acceder a tu cuenta.
                </p>
                <form className={styles.formulario} onSubmit={(event) => { event.preventDefault(); setCurrentStep(1); }}>
                    <div className={styles.campo}>
                        <label htmlFor="recover-password">Nueva contraseña</label>
                        <div className="relative">
                            <Input
                                id="recover-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="Mínimo 8 caracteres"
                                className="pr-10"
                            />
                            <button
                                type="button"
                                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                                onClick={() => setShowPassword((visible) => !visible)}
                            >
                                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                    </div>
                    <div className={styles.campo}>
                        <label htmlFor="recover-confirmation">Repetir contraseña</label>
                        <div className="relative">
                            <Input
                                id="recover-confirmation"
                                type={showConfirmation ? 'text' : 'password'}
                                value={passwordConfirmation}
                                onChange={(event) => setPasswordConfirmation(event.target.value)}
                                placeholder="Repetir contraseña"
                                className="pr-10"
                            />
                            <button
                                type="button"
                                aria-label={showConfirmation ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                                onClick={() => setShowConfirmation((visible) => !visible)}
                            >
                                {showConfirmation ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                    </div>
                    <Button type="submit" className="w-full">Restablecer contraseña</Button>
                </form>
            </>
        );
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className={styles.cardPrincipal}>
                <Stepper steps={steps} currentStep={currentStep} />
                {renderStep()}
                <Button type="button" variant="link" disabled={currentStep === 1} onClick={handlePrevious}>
                    Volver al paso anterior
                </Button>
            </div>
        </div>
    );
};

export default RecoverPassword;

const styles = {
    cardPrincipal: 'flex w-full max-w-[650px] flex-col items-center space-y-3 rounded-[12px] border border-[#e2e8f0] bg-white px-6 py-8 text-center shadow-[4px_4px_4px_0px_#0000001a] sm:px-15 sm:py-10',
    cardInformativa: 'flex w-full max-w-[500px] items-start gap-3 rounded-[8px] border border-[#bfdbfe] bg-[#eff6ff] p-4 text-left',
    formulario: 'flex w-[500px] max-w-full min-w-0 flex-col justify-center gap-3 text-center',
    campo: 'flex w-full flex-col gap-3 text-left pb-3',
    icono: 'flex h-25 w-25 items-center justify-center self-center rounded-full bg-[#bfdbfe]',
};
