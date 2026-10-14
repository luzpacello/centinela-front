import { useEffect, useState } from 'react';
import { fetchUserRecentActivity, type UserRecentActivity } from '../services/userRecentActivityService';

export function useUserRecentActivity(userId: string) {
  const [state, setState] = useState<{
    userId: string | null;
    activity: UserRecentActivity[];
    errorMessage: string | null;
  }>({ userId: null, activity: [], errorMessage: null });

  useEffect(() => {
    const controller = new AbortController();

    fetchUserRecentActivity(userId, controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setState({ userId, activity: items, errorMessage: null });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState({ userId, activity: [], errorMessage: 'No se pudo cargar la actividad reciente.' });
        }
      });

    return () => controller.abort();
  }, [userId]);

  return {
    activity: state.userId === userId ? state.activity : [],
    isLoading: state.userId !== userId,
    errorMessage: state.userId === userId ? state.errorMessage : null,
  };
}
