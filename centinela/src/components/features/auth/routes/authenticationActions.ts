import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { submitLoginCredentials } from '../services/authService.ts';
import { clearPendingLoginSession, getPendingTwoFactorPath, readPendingLoginSession, savePendingLoginSession } from '../services/pendingLoginSession.ts';
import type { AuthenticationFailure, LoginCredentials } from '../types/authentication.ts';
import { validateLoginFields } from '../utils/validateAuthenticationFields.ts';
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
    recordarSesion: submittedFields.recordarSesion === true,
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
