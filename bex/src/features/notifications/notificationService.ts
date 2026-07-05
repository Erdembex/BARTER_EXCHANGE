import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { apiClient } from '@/lib/api';
import { shouldUseDemoData } from '@/lib/devMode';
import { usesRestBackend } from '@/lib/restBackend';
import { setDevProfile } from '@/lib/devProfileStore';

let initialized = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  async initialize(userId: string): Promise<void> {
    if (initialized) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'BEX Bildirimleri',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    initialized = true;

    if (finalStatus !== 'granted') return;

    try {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;

      if (!projectId) return;

      const token = (
        await Notifications.getExpoPushTokenAsync({ projectId })
      ).data;

      if (shouldUseDemoData()) {
        await setDevProfile(userId, { expoPushToken: token });
        return;
      }

      if (await usesRestBackend()) {
        try {
          await apiClient.post('/api/device/fcm-token', {
            token,
            platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
          });
        } catch {
          // Push kaydı isteğe bağlı
        }
      }
    } catch {
      // Expo Go / emülatörde push token alınamayabilir — yerel bildirimler yeterli
    }
  },

  async presentLocal(title: string, body: string, data?: Record<string, string>) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, data },
        trigger: null,
      });
    } catch {
      // İzin yoksa veya web'de sessizce atla
    }
  },

  async setBadgeCount(count: number) {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch {
      // Desteklenmeyen platform
    }
  },
};
