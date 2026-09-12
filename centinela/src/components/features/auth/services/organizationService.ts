import { ApiRequestError, sendJsonPostRequest } from '../../../../services/api.js';
import type { CreatedOrganization, OrganizationRegistrationRequest } from '../types/authentication.ts';
import { isCreatedOrganization } from '../utils/validateAuthenticationResponses.ts';

export async function createOrganizationWithAdministrator(
  fields: OrganizationRegistrationRequest,
  signal?: AbortSignal,
): Promise<CreatedOrganization> {
  const response = await sendJsonPostRequest('/organizations', {
    organizationName: fields.organizationName.trim(),
    fullName: fields.fullName.trim(),
    username: fields.username.trim(),
    email: fields.email.trim(),
    password: fields.password,
  }, { signal, expectedStatus: 201 });
  
  if (!isCreatedOrganization(response)) {
    throw new ApiRequestError('No se pudo interpretar la confirmación de creación. Verificá si tu cuenta fue creada antes de volver a intentar.');
  }
  return response;
}
