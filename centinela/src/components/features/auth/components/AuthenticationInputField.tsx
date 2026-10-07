import { useState, type ComponentProps, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

interface AuthenticationInputFieldProps extends ComponentProps<typeof Input> {
  id: string;
  label: string;
  error?: string;
  description?: string;
  /** Ícono decorativo a la izquierda del input. Opcional para no afectar otros usos. */
  icon?: ReactNode;
  /** Permite ajustar el estilo del label desde el punto de uso. */
  labelClassName?: string;
}

export function AuthenticationInputField({
  id,
  label,
  error,
  description,
  type,
  className,
  labelClassName,
  icon,
  ...inputProps
}: AuthenticationInputFieldProps) {
  const descriptionIds = [description && `${id}-description`, error && `${id}-error`].filter(Boolean).join(' ');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordField = type === 'password';
  const inputClassName = [icon ? 'pl-11' : '', isPasswordField ? 'pr-10' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <Field data-invalid={Boolean(error)} className="text-left">
      <FieldLabel htmlFor={id} className={labelClassName}>{label}</FieldLabel>

      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#94a3b8]" aria-hidden="true">
            {icon}
          </span>
        )}

        <Input
          {...inputProps}
          id={id}
          type={isPasswordField ? (isPasswordVisible ? 'text' : 'password') : type}
          className={inputClassName || undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={descriptionIds || undefined}
        />

        {isPasswordField && (
          <button
            type="button"
            aria-label={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-700"
            onClick={() => setIsPasswordVisible((visible) => !visible)}
          >
            {isPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>

      {description && <FieldDescription id={`${id}-description`}>{description}</FieldDescription>}

      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </Field>
  );
}
