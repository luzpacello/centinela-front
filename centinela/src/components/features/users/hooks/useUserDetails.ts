import { useEffect, useState } from 'react';
import { ApiRequestError } from '@/services/apiClient';
import { fetchUserDetails } from '../services/userDetailsService';
import type { UserDetails } from '../types/user';

interface UserDetailsState {
  requestKey: string | null;
  user: UserDetails | null;
  errorMessage: string | null;
}

export function useUserDetails(userId: string | undefined, isCurrentUser: boolean) {
  const [requestVersion, setRequestVersion] = useState(0);
  const [state, setState] = useState<UserDetailsState>({
    requestKey: null,
    user: null,
    errorMessage: null,
  });
  const requestKey = userId
    ? `${isCurrentUser ? 'profile' : 'admin'}:${userId}:${requestVersion}`
    : null;

  useEffect(() => {
    if (!userId || !requestKey) return;

    const selectedUserId = userId;
    const selectedRequestKey = requestKey;
    const controller = new AbortController();

    async function loadUser() {
      try {
        const user = await fetchUserDetails(selectedUserId, {
          isCurrentUser,
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setState({ requestKey: selectedRequestKey, user, errorMessage: null });
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setState({
          requestKey: selectedRequestKey,
          user: null,
          errorMessage: error instanceof ApiRequestError
            ? error.message
            : 'No se pudo cargar el usuario. Intentá nuevamente.',
        });
      }
    }

    loadUser();
    return () => controller.abort();
  }, [isCurrentUser, requestKey, userId]);

  const hasCurrentResponse = requestKey !== null && state.requestKey === requestKey;

  return {
    user: hasCurrentResponse ? state.user : null,
    isLoading: Boolean(userId) && !hasCurrentResponse,
    errorMessage: userId
      ? hasCurrentResponse ? state.errorMessage : null
      : 'No se indicó qué usuario se debe cargar.',
    retry: () => setRequestVersion((version) => version + 1),
  };
}
