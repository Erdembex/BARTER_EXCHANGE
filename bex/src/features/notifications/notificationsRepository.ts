import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { shouldUseDemoData } from '@/lib/devMode';
import { demoStore } from '@/lib/demoStore';
import { BexNotification, COLLECTIONS, NotificationType } from '@/types';
import { notificationService } from './notificationService';

export const notificationsRepository = {
  async getByUser(userId: string): Promise<BexNotification[]> {
    if (shouldUseDemoData()) {
      return demoStore.getNotificationsByUser(userId);
    }
    try {
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as BexNotification);
    } catch {
      return demoStore.getNotificationsByUser(userId);
    }
  },

  async getUnreadCount(userId: string): Promise<number> {
    if (shouldUseDemoData()) {
      return demoStore.getUnreadNotificationCount(userId);
    }
    const list = await this.getByUser(userId);
    return list.filter((n) => !n.read).length;
  },

  async markRead(id: string, userId: string): Promise<void> {
    if (shouldUseDemoData()) {
      demoStore.markNotificationRead(id, userId);
      return;
    }
    await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, id), { read: true });
  },

  async markAllRead(userId: string): Promise<void> {
    if (shouldUseDemoData()) {
      demoStore.markAllNotificationsRead(userId);
      return;
    }
    const list = await this.getByUser(userId);
    const batch = writeBatch(db);
    list.filter((n) => !n.read).forEach((n) => {
      batch.update(doc(db, COLLECTIONS.NOTIFICATIONS, n.id), { read: true });
    });
    await batch.commit();
  },
};

type NotifyParams = {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, string>;
  /** Giriş yapmış kullanıcıya anlık yerel bildirim göster */
  showLocalForUserId?: string;
};

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
  // Canlıda Firestore bildirimleri Cloud Functions yazar (kurallar client create: false)

  if (params.showLocalForUserId === params.userId) {
    await notificationService.presentLocal(params.title, params.body, params.data);
  }
}

export async function notifyAdmins(
  params: Omit<NotifyParams, 'userId' | 'showLocalForUserId'>
): Promise<void> {
  const { loadDevProfiles, getUidsByRole } = await import('@/lib/devProfileStore');
  await loadDevProfiles();
  const adminUids = getUidsByRole('admin');

  for (const userId of adminUids) {
    await notifyUser({ ...params, userId });
  }
}
