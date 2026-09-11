export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

export type LoginResponse = { tempSessionId: string } & (
  | { require2faSetup: true; require2faInput: false; totpSetup: { secret: string; qrCodeUrl: string } }
  | { require2faSetup: false; require2faInput: true }
);

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
