import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { submitLoginCredentials } from '../services/authService.ts';
import { createOrganizationWithAdministrator } from '../services/organizationService.ts';
import { clearPendingLoginSession, getPendingTwoFactorPath, readPendingLoginSession, savePendingLoginSession } from '../services/pendingLoginSession.ts';
import type { AuthenticationFailure, LoginCredentials, OrganizationRegistrationFields, OrganizationRegistrationResult } from '../types/authentication.ts';
import { validateLoginFields, validateOrganizationRegistrationFields } from '../utils/validateAuthenticationFields.ts';
import { isRecord } from '../utils/validateAuthenticationResponses.ts';
import { mapAuthenticationError } from '../utils/mapAuthenticationError.ts';

async function readSubmittedFields(request: Request): Promise<Record<string, unknown>> {
  const fields: unknown = await request.json().catch(() => null);
  return isRecord(fields) ? fields : {};
}

function readTextField(fields: Record<string, unknown>, name: string): string {
  return typeof fields[name] === 'string' ? fields[name] : '';
}

export async function submitLoginAction({ request }: Pick<ActionFunctionArgs, 'request'>): Promise<AuthenticationFailure<LoginCredentials> | Response> {
  const submittedFields = await readSubmittedFields(request);
  const credentials: LoginCredentials = {
    email: readTextField(submittedFields, 'email'),
    password: readTextField(submittedFields, 'password'),
    rememberMe: submittedFields.rememberMe === true,
  };
  const fieldErrors = validateLoginFields(credentials);
  if (Object.keys(fieldErrors).length) return { success: false, fieldErrors };
  clearPendingLoginSession();
  try {
    const response = await submitLoginCredentials(credentials, request.signal);
    request.signal.throwIfAborted();
    savePendingLoginSession(response);
    return redirect(getPendingTwoFactorPath(response));
  } catch (error) {
    if (request.signal.aborted) throw error;
    return mapAuthenticationError<LoginCredentials>(error, 'login');
  }
}

export async function submitOrganizationRegistrationAction({ request }: Pick<ActionFunctionArgs, 'request'>): Promise<OrganizationRegistrationResult> {
  const submittedFields = await readSubmittedFields(request);
  const fields: OrganizationRegistrationFields = {
    organizationName: readTextField(submittedFields, 'organizationName'),
    fullName: readTextField(submittedFields, 'fullName'),
    username: readTextField(submittedFields, 'username'),
    email: readTextField(submittedFields, 'email'),
    password: readTextField(submittedFields, 'password'),
    passwordConfirmation: readTextField(submittedFields, 'passwordConfirmation'),
    acceptedTerms: submittedFields.acceptedTerms === true,
  };
  const fieldErrors = validateOrganizationRegistrationFields(fields);
  if (Object.keys(fieldErrors).length) return { success: false, fieldErrors };
  try {
    const organization = await createOrganizationWithAdministrator(fields, request.signal);
    request.signal.throwIfAborted();
    return { success: true, organization };
  } catch (error) {
    if (request.signal.aborted) throw error;
    return mapAuthenticationError<OrganizationRegistrationFields>(error, 'registration');
  }
}

export function clearPendingLoginLoader(): null {
  clearPendingLoginSession();
  return null;
}

export function loadPendingTwoFactorSession({ request }: Pick<LoaderFunctionArgs, 'request'>) {
  const session = readPendingLoginSession();
  if (!session) return redirect('/login');
  const nextPath = getPendingTwoFactorPath(session);
  if (new URL(request.url).pathname !== nextPath) return redirect(nextPath);
  return session;
}
