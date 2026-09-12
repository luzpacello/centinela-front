import { useValidatedAuthenticationForm } from './useValidatedAuthenticationForm';
import { validateOrganizationRegistrationFields } from '../utils/validateAuthenticationFields';
import type { CreatedOrganization, OrganizationRegistrationFields } from '../types/authentication';

export function useOrganizationRegistration() {
  return useValidatedAuthenticationForm<OrganizationRegistrationFields, { success: true; organization: CreatedOrganization }>(
    { organizationName: '', fullName: '', username: '', email: '', password: '', passwordConfirmation: '', acceptedTerms: false },
    validateOrganizationRegistrationFields, '/signup',
  );
}
