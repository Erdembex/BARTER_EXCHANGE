import { demoStore } from '@/lib/demoStore';
import { usesRestBackend } from '@/lib/restBackend';
import { shouldUseDemoData } from '@/lib/devMode';
import { BexNotification, NotificationType } from '@/types';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
} from './notificationsApi';

export const notificationsRepository = {
  async getByUser(userId: string): Promise<BexNotification[]> {
    if (shouldUseDemoData()) {
      return demoStore.getNotificationsByUser(userId);
    }

    if (await usesRestBackend()) {
      try {
        return await fetchNotifications(userId);
      } catch {
        return [];
      }
    }

    return [];
  },

  async getUnreadCount(userId: string): Promise<number> {
    if (shouldUseDemoData()) {
      return demoStore.getUnreadNotificationCount(userId);
    }

    if (await usesRestBackend()) {
      try {
        return await fetchUnreadCount();
      } catch {
        return 0;
      }
    }

    return 0;
  },

  async markRead(id: string, userId: string): Promise<void> {
    if (shouldUseDemoData()) {
      demoStore.markNotificationRead(id, userId);
      return;
    }

    // REST: tekil okundu uç noktası yok; yerel state yenilemesi yeterli
  },

  async markAllRead(userId: string): Promise<void> {
    if (shouldUseDemoData()) {
      demoStore.markAllNotificationsRead(userId);
      return;
    }

    if (await usesRestBackend()) {
      try {
        await markAllNotificationsRead();
      } catch {
        // sessiz
      }
    }
  },
};

type NotifyParams = {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, string>;
  showLocalForUserId?: string;
};

/** Demo modda yerel bildirim; REST modunda backend olayları yazar. */
export async function notifyUser(params: NotifyParams): Promise<void> {
  if (shouldUseDemoData()) {
    demoStore.addNotification({
      userId: params.userId,
      title: params.title,
      body: params.body,
      type: params.type,
      data: params.data,
    });
  }
}

export async function notifyAdmins(_params: Omit<NotifyParams, 'userId'>): Promise<void> {
  if (!shouldUseDemoData()) return;
}
