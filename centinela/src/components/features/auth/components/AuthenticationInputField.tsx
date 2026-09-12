import type { ComponentProps } from 'react';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

interface AuthenticationInputFieldProps extends ComponentProps<typeof Input> {
  id: string;
  label: string;
  error?: string;
  description?: string;
}

export function AuthenticationInputField({ id, label, error, description, ...inputProps }: AuthenticationInputFieldProps) {
  const descriptionIds = [description && `${id}-description`, error && `${id}-error`].filter(Boolean).join(' ');
  return (
    <Field data-invalid={Boolean(error)} className="text-left">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>

      <Input {...inputProps} id={id} aria-invalid={Boolean(error)} aria-describedby={descriptionIds || undefined} />
      
      {description && <FieldDescription id={`${id}-description`}>{description}</FieldDescription>}
      
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
    </Field>
  );
}
