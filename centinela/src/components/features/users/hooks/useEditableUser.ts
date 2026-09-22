import { useCallback, useState } from 'react';
import type { EditableUserValues, UserDetails } from '../types/user';

function toEditableValues(user: UserDetails): EditableUserValues {
  return {
    nombreCompleto: user.nombreCompleto,
    emailUsuario: user.emailUsuario,
    organizacionId: user.organizacionId,
    rol: user.rol,
    activo: user.activo,
  };
}

export function useEditableUser(user: UserDetails) {
  const [values, setValues] = useState<EditableUserValues>(() => toEditableValues(user));

  const updateField = useCallback(<Field extends keyof EditableUserValues>(
    field: Field,
    value: EditableUserValues[Field],
  ) => {
    setValues((currentValues) => ({ ...currentValues, [field]: value }));
  }, []);

  const reset = useCallback(() => setValues(toEditableValues(user)), [user]);

  return { values, updateField, reset };
}
