import { useState, type ComponentProps } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

interface AuthenticationInputFieldProps extends ComponentProps<typeof Input> {
  id: string;
  label: string;
  error?: string;
  description?: string;
}

export function AuthenticationInputField({ id, label, error, description, type, className, ...inputProps }: AuthenticationInputFieldProps) {
  const descriptionIds = [description && `${id}-description`, error && `${id}-error`].filter(Boolean).join(' ');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordField = type === 'password';

  return (
    <Field data-invalid={Boolean(error)} className="text-left">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>

      {isPasswordField ? (
        <div className="relative">
          <Input
            {...inputProps}
            id={id}
            type={isPasswordVisible ? 'text' : 'password'}
            className={className ? `${className} pr-10` : 'pr-10'}
            aria-invalid={Boolean(error)}
            aria-describedby={descriptionIds || undefined}
          />

          <button
            type="button"
            aria-label={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-700"
            onClick={() => setIsPasswordVisible((visible) => !visible)}
          >
            {isPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      ) : (
        <Input
          {...inputProps}
          id={id}
          type={type}
          className={className}
          aria-invalid={Boolean(error)}
          aria-describedby={descriptionIds || undefined}
        />
      )}

      {description && <FieldDescription id={`${id}-description`}>{description}</FieldDescription>}

      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </Field>
  );
}
