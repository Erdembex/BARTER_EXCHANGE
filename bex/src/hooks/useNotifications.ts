import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
  notificationService,
  notificationsRepository,
} from '@/features/notifications';
import { useNotificationNavigation } from '@/hooks/useNotificationNavigation';

export function useNotifications() {
  const { firebaseUser } = useAuthStore();
  const userId = firebaseUser?.uid ?? null;
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }
    const count = await notificationsRepository.getUnreadCount(userId);
    setUnreadCount(count);
    await notificationService.setBadgeCount(count);
  }, [userId]);

  useNotificationNavigation(refreshUnread);

  useEffect(() => {
    if (!userId) {
      notificationService.resetSession();
      return;
    }
    notificationService.initialize(userId).then(refreshUnread);

    const interval = setInterval(refreshUnread, 30000);
    return () => clearInterval(interval);
  }, [userId, refreshUnread]);

  return { unreadCount, refreshUnread };
}
