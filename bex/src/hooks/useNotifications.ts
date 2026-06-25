import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
  notificationService,
  notificationsRepository,
} from '@/features/notifications';

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

  useEffect(() => {
    if (!userId) return;
    notificationService.initialize(userId).then(refreshUnread);
  }, [userId, refreshUnread]);

  return { unreadCount, refreshUnread };
}
