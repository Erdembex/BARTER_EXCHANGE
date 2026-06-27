import { FieldValue } from 'firebase-admin/firestore';
import { db, COLLECTIONS } from './firestore';

export type NotificationPayload = {
  userId: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, string>;
};

export async function pushNotification(params: NotificationPayload): Promise<void> {
  await db.collection(COLLECTIONS.NOTIFICATIONS).add({
    userId: params.userId,
    title: params.title,
    body: params.body,
    type: params.type,
    data: params.data ?? {},
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function pushNotificationToMany(
  userIds: string[],
  params: Omit<NotificationPayload, 'userId'>
): Promise<void> {
  const unique = [...new Set(userIds.filter(Boolean))];
  await Promise.all(unique.map((userId) => pushNotification({ ...params, userId })));
}

export async function getBusinessOwnerUid(businessId: string): Promise<string | null> {
  const snap = await db.collection(COLLECTIONS.BUSINESSES).doc(businessId).get();
  if (!snap.exists) return null;
  return (snap.data()?.ownerUid as string) ?? null;
}

export async function getAdminUids(): Promise<string[]> {
  const snap = await db.collection(COLLECTIONS.USERS).where('role', '==', 'admin').get();
  return snap.docs.map((doc) => doc.id);
}

export async function notifyBusinessOwner(
  businessId: string,
  params: Omit<NotificationPayload, 'userId'>
): Promise<void> {
  const ownerUid = await getBusinessOwnerUid(businessId);
  if (!ownerUid) return;
  await pushNotification({ ...params, userId: ownerUid });
}
