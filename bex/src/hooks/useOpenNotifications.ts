import { useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { openNotificationsList } from '@/features/notifications/notificationNavigation';

export function useOpenNotifications() {
  const { bexUser } = useAuthStore();

  return useCallback(() => {
    void openNotificationsList(bexUser?.role);
  }, [bexUser?.role]);
}
