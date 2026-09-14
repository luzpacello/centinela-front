export interface LoginCredentials {
  email: string;
  password: string;
  recordarSesion: boolean;
}

// Usuario devuelto por el backend en cada respuesta de sesión.
export interface UserSession {
  id: string;
  organizacionId: string;
  nombreCompleto: string;
  email: string;
  rol: string;
  instanciasPermitidas: number[];
  tiene2FA: boolean;
}

// Contrato real de /auth/login, /auth/2fa/verify y /auth/refresh.
// challengeToken/accessToken/refreshToken son opcionales: el backend los omite
// según el estado del login (2FA pendiente vs. sesión emitida).
export interface LoginResponse {
  success: boolean;
  user: UserSession;
  requiresTwoFactor: boolean;
  requiresTwoFactorSetup: boolean;
  challengeToken?: string;
  challengeExpiresAt?: string;
  accessToken?: string;
  refreshToken?: string;
  accessExpiresAt?: string;
  refreshExpiresAt?: string;
  recordarSesion: boolean;
}

// Contrato real de /auth/2fa/setup.
export interface TwoFactorSetupResponse {
  secret: string;
  otpAuthUrl: string;
  challengeToken: string;
  expiresAt: string;
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
