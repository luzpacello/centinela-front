import { useRef, useState, type FormEvent } from 'react';
import { useFetcher } from 'react-router';
import type { AuthenticationFailure, FieldErrors } from '../types/authentication';

export function useValidatedAuthenticationForm<Fields extends object, Success = never>(
  initialValues: Fields,
  validateFields: (values: Fields) => FieldErrors<Fields>,
  actionPath: string,
) {
  const fetcher = useFetcher<AuthenticationFailure<Fields> | Success>();
  const [values, setValues] = useState(initialValues);
  const [validationErrors, setValidationErrors] = useState<FieldErrors<Fields>>({});
  const submissionInProgress = useRef(false);
  const result = fetcher.data;
  const failure = result && typeof result === 'object' && 'success' in result && result.success === false
    ? result as AuthenticationFailure<Fields> : undefined;
  const fieldErrors = { ...validationErrors, ...failure?.fieldErrors };
  const isSubmitting = fetcher.state !== 'idle';

  function updateField<Name extends keyof Fields>(name: Name, value: Fields[Name]) {
    const updatedValues = { ...values, [name]: value };
    setValues(updatedValues);
    const nextErrors = { ...fieldErrors };
    const updatedErrors = validateFields(updatedValues);
    // Revalida los errores visibles, incluyendo la confirmación cuando cambia la contraseña.
    for (const field of Object.keys(nextErrors) as Array<keyof Fields>) {
      if (updatedErrors[field]) nextErrors[field] = updatedErrors[field];
      else delete nextErrors[field];
    }
    setValidationErrors(nextErrors);
    if (failure) fetcher.reset();
  }

  function validateField(name: keyof Fields) {
    const message = validateFields(values)[name];
    setValidationErrors((errors) => ({ ...errors, [name]: message }));
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionInProgress.current || isSubmitting) return;
    const errors = validateFields(values);
    setValidationErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      const firstInvalidName = Object.keys(errors)[0];
      const firstInvalidControl = event.currentTarget.elements.namedItem(firstInvalidName);
      if (firstInvalidControl instanceof HTMLElement) firstInvalidControl.focus();
      return;
    }
    submissionInProgress.current = true;
    try {
      // El router recibe JSON y su action arma el payload exacto que consumirá el backend.
      await fetcher.submit(JSON.stringify(values), { action: actionPath, method: 'post', encType: 'application/json' });
    } finally {
      submissionInProgress.current = false;
    }
  }

  return { values, fieldErrors, formError: failure?.message, isSubmitting, result, updateField, validateField, submitForm };
}
