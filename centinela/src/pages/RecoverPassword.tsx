import React, { useState } from 'react';
import { Eye, EyeOff, MoveLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Stepper } from '@/components/ui/stepper';
import { ContainerCard, InfoCard } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router';
import { toast } from '@/components/ui/toast';
import { apiClient, ApiRequestError } from '@/services/apiClient';

const steps = ['Solicitar', 'Verificar', 'Nueva contraseña'];
const MAX_RESET_ATTEMPTS = 3;

export const RecoverPassword: React.FC = () => {
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState(1);

    //datos del flujo, solo mem.
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    //estados de carga
    const [isSubmitting, setIsSubmitting] = useState(false);
    //errores por campo
    const [emailError, setEmailError] = useState('');
    const [codeError, setCodeError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [ConfirmationError, setConfirmationError] = useState('');
    //intentos fallidos
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [resetBlocked, setResetBlocked] = useState(false);
    //visibilidad de contraseñas
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);


    /* Validación de correo */
    const isValidEmail = (value: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    };
    /*Validación de reglas para contra */
    const validatePassword = (value: string): string[] => {
        const errors: string[] = [];
        if (value.length < 8 || value.length > 12) {
            errors.push('Debe tener entre 8 y 12 caracteres.');
        }
        if (!/[A-Z]/.test(value)) {
            errors.push('Debe contener al menos una letra mayúscula.');
        }
        if (!/[0-9]/.test(value)) {
            errors.push('Debe contener al menos un número.');
        }
        if (!/[^A-Za-z0-9]/.test(value)) {
            errors.push('Debe contener al menos un carácter especial.');
        }
        return errors;
    };
    /*Paso 1: solicitud de recuperación */
    const handleRequestCode = async () => {
        setEmailError('');
        const normalizedEmail = email.trim();
        if (!normalizedEmail) {
          setEmailError('Ingresá tu correo electrónico.');
          return;
        }
        if (!isValidEmail(normalizedEmail)) {
          setEmailError('Ingresá un correo electrónico válido.');
          return;
        }
        setIsSubmitting(true);
        try {
          await apiClient.post('/auth/password/forgot', {
            email: normalizedEmail,
          });
            setEmail(normalizedEmail);
            setCode(''); //seteado de estados anteriores
            setCodeError('');
            setPassword('');
            setPasswordConfirmation('');
            setPasswordError('');
            setConfirmationError('');
            setFailedAttempts(0);
            setResetBlocked(false);
              setCurrentStep(2);
        } catch (error) {
            if (error instanceof ApiRequestError) {
                setEmailError(
                    error.message || 'No se pudo solicitar el código. Intentá nuevamente.',
                );
            } else {
                setEmailError(
                    'No se pudo solicitar el código. Intentá nuevamente.',
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    };
    /*Para el paso 2 solamente se valida los digitos */
    const handleVerifyCodeStep = () => {
        setCodeError('');
        if (!/^[0-9]{6}$/.test(code)) {
            setCodeError('Ingresá un código válido de 6 dígitos.');
            return;
        }
        setCurrentStep(3);
    };
    /*paso 3, se valida la contraseña y se envia la solicitu de reset */
    const handleResetPassword = async () => {
            setPasswordError('');
        setConfirmationError('');
        setCodeError('');
        if (resetBlocked) return;
        const passwordErrors = validatePassword(password);
        if (passwordErrors.length > 0) {
          setPasswordError(passwordErrors.join(' '));
          return;
        }
        if (password !== passwordConfirmation) {
          setConfirmationError('Las contraseñas no coinciden.');
          return;
        }
        setIsSubmitting(true);
        try {
            await apiClient.post('/auth/password/reset', {
                email,
                codigo: code,
                nuevaContrasena: password,
            });
            toast.add({
              title: 'Contraseña restablecida',
              description: 'Contraseña restablecida con éxito.',
              type: 'success',
              priority: 'high',
            });
            setCode(''); //seteado se datos sensibles
            setPassword('');
            setPasswordConfirmation('');
            setEmail('');
            navigate('/login', { replace: true });
        } catch (error) {
            if (error instanceof ApiRequestError) {
                if (
                    error.errorCode === 'RESET_FAILED' ||
                    error.status === 400
                    ) {
                    const nextAttempts = failedAttempts + 1;
                    const remainingAttempts = MAX_RESET_ATTEMPTS - nextAttempts;

                    setFailedAttempts(nextAttempts);

                    setCodeError(
                        'El código ingresado es incorrecto o ha expirado.',
                    );

                    if (nextAttempts >= MAX_RESET_ATTEMPTS) {
                        setResetBlocked(true);

                        toast.add({
                        title: 'Proceso bloqueado',
                        description:
                            'El código fue rechazado 3 veces. El proceso de recuperación quedó bloqueado. Reiniciá el proceso para solicitar un nuevo código.',
                        type: 'error',
                        priority: 'high',
                        });

                        return;
                    }

                    toast.add({
                        title: 'Código inválido o expirado',
                        description: `El código ingresado no es válido o expiró. Te quedan ${remainingAttempts} ${
                        remainingAttempts === 1 ? 'intento' : 'intentos'
                        } antes de bloquear el proceso.`,
                        type: 'warning',
                        priority: 'high',
                    });

                    return;
                }
                setPasswordError(error.message || 'No se pudo restablecer la contraseña. Intentá nuevamente.',);
                return;
            }

            setPasswordError('No se pudo restablecer la contraseña. Intentá nuevamente.',);
        } finally {
            setIsSubmitting(false);
        }
    };
    // reinicio del flujo
    const handleRestart = () => {
        setCurrentStep(1);
        setEmail('');
        setCode('');
        setPassword('');
        setPasswordConfirmation('');
        setEmailError('');
        setCodeError('');
        setPasswordError('');
        setConfirmationError('');
        setFailedAttempts(0);
        setResetBlocked(false);
        setShowPassword(false);
        setShowConfirmation(false);
    };
    //control para volver al paso anterior
    const handlePrevious = () => {
        if (currentStep > 1) setCurrentStep((previousStep) => previousStep - 1);
    };

    const renderStep = () => {
        if (currentStep === 1) {
            return (
                <>
                    <h1 className='text-center'>Recuperar contraseña</h1>
                    <p className="text-secundario mb-4 ">
                        Ingresá tu correo electrónico asociado a tu cuenta y te enviaremos un codigo para recuperar el acceso a Centinela.
                    </p>
                    <InfoCard>
                        <label>Te enviaremos un código de verificación a tu correo electrónico.</label>
                    </InfoCard>
                    <form 
                        className={styles.formulario} 
                        onSubmit={(event) => { 
                            event.preventDefault(); handleRequestCode(); 
                        }}
                    >
                        <div className={styles.campo}>
                            <label htmlFor="recover-email">Correo electrónico</label>
                            <Input
                                id="recover-email"
                                type="email"
                                value={email}
                                onChange={(event) => {
                                setEmail(event.target.value);

                                if (emailError) {
                                    setEmailError('');
                                }
                                }}
                                placeholder="ejemplo@correo.com"
                                aria-invalid={Boolean(emailError)}
                                aria-describedby={
                                emailError ? 'recover-email-error' : undefined
                                }
                                disabled={isSubmitting}
                            />
                            {emailError && (
                                <p
                                    id="recover-email-error"
                                    role="alert"
                                    className="text-sm text-destructive"
                                >
                                    {emailError}
                                </p>
                            )}
                        </div>
                        <Button 
                            type="submit" 
                            className="w-full"
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? 'Enviando código'
                                : 'Enviar código de recuperación'}
                        </Button>
                    </form>
                </>
            );
        }

        if (currentStep === 2) {
            return (
                <>
                    <h1 className='text-center'>Verifica tu identidad</h1>
                    <p className="text-secundario">
                        Te enviamos un código de verificación de 6 dígitos al correo{' '}
                        {email || 'tu correo electrónico'}. Ingresado para continuar.
                    </p>
                    <form 
                        className={styles.formulario} 
                        onSubmit={(event) => { 
                            event.preventDefault(); 
                            handleVerifyCodeStep(); 
                        }}
                    >
                        <div className={styles.campo}>
                            <label htmlFor="recover-code">Código de verificación</label>
                            <div className="flex flex-col items-center gap-4">
                                <InputOTP
                                    id="recover-code"
                                    maxLength={6}
                                    value={code}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    onChange={(value: string) => {
                                        const numericValue = value.replace(/\D/g, '').slice(0, 6);
                                        setCode(numericValue);
                                        if (codeError) setCodeError('');
                                    }}
                                    aria-invalid={Boolean(codeError)}
                                    aria-describedby={
                                        codeError ? 'recover-code-error' : undefined
                                    }
                                >
                                    <InputOTPGroup className="w-full gap-4">
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                        <InputOTPSlot index={3} />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                    </InputOTPGroup>
                                </InputOTP>
                                {codeError ? (
                                    <p 
                                        id="recover-code-error"
                                        role="alert"
                                        className='text-sm text-desctructive'
                                    >
                                        {codeError}
                                    </p>
                                ) : (
                                    <p className='text-caption'>
                                        Ingresá exactamente 6 dígitos.
                                    </p>
                                )}
                            </div>
                            
                        </div>
                        <Button 
                            type="submit" 
                            className="w-full"
                            disabled={code.length !== 6}
                        >
                            Verificar código
                        </Button>
                    </form>
                    {!resetBlocked && (
                        <div className='my-4 w-full h-full'>
                            <Button 
                                type="button" 
                                variant="link" 
                                disabled={isSubmitting} 
                                onClick={handlePrevious}
                                className="py-2 mt-2 border rounded-xl text-center shadow-sm w-full h-full flex items-center justify-center"
                            >
                                Volver al paso anterior
                            </Button>
                        </div>
                    
                )}
                </>
            );
        }

        return (
            <>
                <h1 className='text-center'>Creá tu nueva contraseña</h1>
                <p className="text-secundario">
                    Ingresa y confirmá tu nueva contraseña para completar la recuperación de tu cuenta.
                </p>
                {resetBlocked && (
                    <div
                        role="alert"
                        className='w-full max-w-[500px] rounded-[8px] border border-red-200 bg-red-50 p-4 text-left'
                    >
                        <p className='font-medium text-red-700'>
                            Se alcanzo el máximo de intentos.
                        </p>
                        <p className='mt-1 text-ms text-red-600'>
                            El código de recuperación fue bloqueada. Reinicia el proceso para solicitar un nuevo código.
                        </p>
                    </div>
                )}
                <form 
                    className={styles.formulario} 
                    onSubmit={(event) => { 
                        event.preventDefault(); 
                        void handleResetPassword();
                    }}>
                    <div className={styles.campo}>
                        <label htmlFor="recover-password">Nueva contraseña</label>
                        <div className="relative">
                            <Input
                                id="recover-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(event) => {
                                    setPassword(event.target.value);
                                    if (passwordError) setPasswordError('');
                                }}
                                placeholder="Entre 8 y 12 caracteres"
                                className="pr-10"
                                aria-invalid={Boolean(password)}
                                aria-describedby={
                                    passwordError ? 'recover-password-error' : undefined
                                }
                                disabled={isSubmitting || resetBlocked}
                            />
                            <button
                                type="button"
                                aria-label={
                                    showPassword 
                                        ? 'Ocultar contraseña' 
                                        : 'Mostrar contraseña'
                                    }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                                onClick={() => setShowPassword((visible) => !visible)}
                            >
                                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                        <div className='text-sm text-muted-foreground'>
                            {!passwordError && (
                                <>
                                    <p>La contraseña debe tener:</p>
                                    <ul className='ml-5 list-disc'>
                                        <li>tener entre 8 y 12 caracteres;</li>
                                        <li>contener al menos una mayúscula;</li>
                                        <li>contener al menos un número;</li>
                                        <li>contener al menos un carácter especial.</li>
                                    </ul>
                                </>
                            )}
                            {passwordError && (
                                <p
                                    id="recover-password-error"
                                    role="alert"
                                    className="text-sm text-destructive"
                                >
                                    {passwordError}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className={styles.campo}>
                        <label htmlFor="recover-confirmation">Confirmar nueva contraseña</label>
                        <div className="relative">
                            <Input
                                id="recover-confirmation"
                                type={showConfirmation ? 'text' : 'password'}
                                value={passwordConfirmation}
                                onChange={(event) => {
                                    setPasswordConfirmation(event.target.value);
                                    if (ConfirmationError) setConfirmationError('');
                                }}
                                placeholder="confirmar contraseña"
                                className="pr-10"
                                aria-invalid={Boolean(ConfirmationError)}
                                aria-describedby={
                                    ConfirmationError
                                        ? 'recover-confirmation-error'
                                        : undefined
                                }
                                disabled={isSubmitting || resetBlocked}
                            />
                            <button
                                type="button"
                                aria-label={showConfirmation ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                                onClick={() => setShowConfirmation((visible) => !visible)}
                                disabled={resetBlocked}
                            >
                                {showConfirmation ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                        {ConfirmationError && (
                            <p
                                id='recover-confirmation-error'
                                role="alert"
                                className='text-sm text-destructive'
                            >
                                {ConfirmationError}
                            </p>
                        )}
                    </div>
                    {resetBlocked ? (
                        <Button 
                            type="submit" 
                            className="w-full"
                            onClick={handleRestart}
                        >
                            Restablecer contraseña
                        </Button>
                    ) : (
                        <Button 
                            type="submit" 
                            className="w-full"
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? 'Restableciendo contraseña...'
                                : 'Restablecer contraseña'
                            }
                        </Button>
                    )}
                </form>
                {!resetBlocked && (
                    <Button 
                        type="button" 
                        variant="link" 
                        disabled={isSubmitting} 
                        onClick={handlePrevious}
                        className="p-3 mt-2 border rounded-xl text-center shadow-sm w-full h-full flex items-center justify-center"
                    >
                        Volver al paso anterior
                    </Button>
                )}
            </>
        );
    };

    return (
        <>
            <ContainerCard className='px-10 min-h-[640px]'>
                <div className="max-w-2xl mx-auto w-full">
                    <Stepper steps={steps} currentStep={currentStep} />
                    <div className="flex flex-col">
                        {renderStep()} 
                    </div>   
                </div>
                <div className="flex w-full justify-center gap-4 mt-4">
                    <MoveLeft className="size-5 text-[#2563eb]" />
                    <Link to="/login" replace className="text-info"> Volver al login</Link>
                </div>
            </ContainerCard>
        </>
        
    );
};

export default RecoverPassword;

const styles = {
    formulario: 'flex max-w-full min-w-0 flex-col justify-center text-center gap-2',
    campo: 'flex w-full flex-col text-left py-3 gap-3',
};
