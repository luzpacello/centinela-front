import { useEffect, useState } from 'react';
import { fetchDeletedUsers } from '../services/deletedUsersService';
import type { UserDetails } from '../types/user';

export function useDeletedUsers(enabled: boolean, refreshVersion: number) {
  const [deletedUsers, setDeletedUsers] = useState<UserDetails[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    async function loadDeletedUsers() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const users = await fetchDeletedUsers(controller.signal);
        if (!controller.signal.aborted) setDeletedUsers(users);
      } catch (error) {
        if (!controller.signal.aborted) {
          setErrorMessage(error instanceof Error ? error.message : 'No se pudo cargar la lista de usuarios eliminados.');
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    void loadDeletedUsers();
    return () => controller.abort();
  }, [enabled, refreshVersion]);

  return { deletedUsers, isLoading, errorMessage };
}
