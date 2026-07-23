import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import { useAuthStore } from '@/store/authStore';
import { getNotificationTarget } from '@/features/notifications/notificationNavigation';
import { mapBackendNotificationType } from '@/features/notifications/notificationTypes';
import { BexNotification } from '@/types';

function buildNotificationFromPushData(
  data: Record<string, unknown>,
  userId: string
): BexNotification {
  const typeRaw = typeof data.type === 'string' ? data.type : '';
  const applicationId =
    typeof data.applicationId === 'string'
      ? data.applicationId
      : typeof data.referenceId === 'string' &&
          typeof data.referenceType === 'string' &&
          data.referenceType.toUpperCase().includes('APPLICATION')
        ? data.referenceId
        : undefined;

  const mappedData: Record<string, string> = {};
  if (applicationId) mappedData.applicationId = applicationId;
  if (typeof data.referenceId === 'string') mappedData.referenceId = data.referenceId;
  if (typeof data.taskId === 'string') mappedData.taskId = data.taskId;
  if (typeof data.businessId === 'string') mappedData.businessId = data.businessId;

  return {
    id: typeof data.notificationId === 'string' ? data.notificationId : 'push',
    userId,
    title: '',
    body: '',
    type: mapBackendNotificationType(typeRaw),
    data: mappedData,
    read: false,
    createdAt: Timestamp.now(),
  };
}

/** Push bildirimine tıklanınca ilgili ekrana yönlendirir. */
export function useNotificationNavigation(onReceived?: () => void) {
  const { firebaseUser, bexUser } = useAuthStore();

  useEffect(() => {
    if (!firebaseUser) return;

    const receivedSub = Notifications.addNotificationReceivedListener(() => {
      onReceived?.();
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = (response.notification.request.content.data ?? {}) as Record<string, unknown>;
      const item = buildNotificationFromPushData(data, firebaseUser.uid);
      const target = getNotificationTarget(item, bexUser?.role);
      if (target) {
        router.push(target);
      } else {
        router.push('/notifications/index');
      }
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [firebaseUser, bexUser?.role, onReceived]);
}
