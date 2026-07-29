import { useCallback } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { getNotificationsListHref } from '@/features/notifications/notificationNavigation';

export function useOpenNotifications() {
  const { bexUser } = useAuthStore();

  return useCallback(() => {
    router.push(getNotificationsListHref(bexUser?.role));
  }, [bexUser?.role]);
}
