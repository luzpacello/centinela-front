export interface LoginCredentials {
  email: string;
  password: string;
  recordarSesion: boolean;
}

// Sesión del usuario tal como la usa la aplicación.
// Se construye a partir de GET /account/profile, que es donde el backend
// expone los datos del usuario (el login ya no los devuelve).
export interface UserSession {
  id: string;
  organizacionId: string;
  nombreCompleto: string;
  email: string;
  rol: string;
  instanciasPermitidas: number[];
  tiene2FA: boolean;
}

// Contrato real de POST /auth/login.
// No devuelve tokens ni datos del usuario: entrega el JWT temporal que habilita
// el flujo 2FA e indica si el usuario ya tiene el segundo factor configurado.
export interface LoginResponse {
  jwtTemporal: string;
  totpVinculado: boolean;
  cambioContrasenaRequerido: boolean;
}

// Contrato real de GET /auth/2fa/qr (requiere Authorization: Bearer <jwtTemporal>).
export interface TwoFactorQrResponse {
  qrBase64: string;
  secretoManual: string;
}

// Contrato real de POST /auth/2fa/verify y POST /auth/refresh.
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Contrato real de GET /account/profile.
export interface PerfilResponse {
  id: string;
  nombreCompleto: string;
  nombreUsuario: string;
  emailUsuario: string;
  organizacionId: string;
  rol: string;
  activo: boolean;
  totpVinculado: boolean;
  cambioContrasenaRequerido: boolean;
  instanciasPermitidas: number[] | null;
}

export interface OrganizationRegistrationRequest {
  organizationName: string;
  fullName: string;
  username: string;
  email: string;
  password: string;
}

export interface OrganizationRegistrationFields extends OrganizationRegistrationRequest {
  passwordConfirmation: string;
  acceptedTerms: boolean;
}

export interface InitialAdministrator {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: 'ADMIN';
  isActive: boolean;
}

export interface CreatedOrganization {
  id: string;
  name: string;
  createdAt: string;
  adminUser: InitialAdministrator;
}

export type FieldErrors<Fields> = Partial<Record<keyof Fields, string>>;

export interface AuthenticationFailure<Fields> {
  success: false;
  fieldErrors: FieldErrors<Fields>;
  message?: string;
  errorCode?: string;
}

export type OrganizationRegistrationResult =
  | AuthenticationFailure<OrganizationRegistrationFields>
  | { success: true; organization: CreatedOrganization };
