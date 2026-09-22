export interface UserDetails {
  id: string;
  nombreCompleto: string;
  nombreUsuario: string;
  emailUsuario: string;
  organizacionId: string;
  rol: string;
  activo: boolean;
  totpVinculado: boolean;
  cambioContrasenaRequerido: boolean;
  fechaCreacion: string;
  fechaUltimoAcceso: string | null;
  instanciasPermitidas: Array<string | number>;
}

export interface EditableUserValues {
  nombreCompleto: string;
  emailUsuario: string;
  organizacionId: string;
  rol: string;
  activo: boolean;
}

export type UpdateEditableUserField = <Field extends keyof EditableUserValues>(
  field: Field,
  value: EditableUserValues[Field],
) => void;

export interface UserDetailsNavigationState {
  isCurrentUser?: boolean;
}
