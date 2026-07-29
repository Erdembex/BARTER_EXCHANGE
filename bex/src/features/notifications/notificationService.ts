import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { apiClient } from '@/lib/api';
import { shouldUseDemoData } from '@/lib/devMode';
import { usesRestBackend } from '@/lib/restBackend';
import { setDevProfile } from '@/lib/devProfileStore';

let initializedForUser: string | null = null;
let lastPushToken: string | null = null;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function resolveExpoProjectId(): string | undefined {
  return (
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId
  );
}

export const notificationService = {
  async initialize(userId: string): Promise<void> {
    if (initializedForUser === userId) return;

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

    initializedForUser = userId;

    if (finalStatus !== 'granted') {
      if (__DEV__) {
        console.warn('[push] Bildirim izni verilmedi.');
      }
      return;
    }

    try {
      const projectId = resolveExpoProjectId();
      if (!projectId) {
        if (__DEV__) {
          console.warn(
            '[push] EXPO_PUBLIC_EAS_PROJECT_ID tanımlı değil. Push token alınamadı — `npx eas init` çalıştır ve .env.local dosyasına project id ekle.'
          );
        }
        return;
      }

      const token = (
        await Notifications.getExpoPushTokenAsync({ projectId })
      ).data;

      lastPushToken = token;

      if (__DEV__) {
        console.log('[push] Expo push token:', token);
      }

      if (shouldUseDemoData()) {
        await setDevProfile(userId, { expoPushToken: token });
        return;
      }

      if (await usesRestBackend()) {
        await apiClient.post('/api/device/fcm-token', {
          token,
          platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
        });
        if (__DEV__) {
          console.log('[push] Token backend\'e kaydedildi.');
        }
      }
    } catch (err) {
      if (__DEV__) {
        console.warn('[push] Token alınamadı:', err);
      }
    }
  },

  async unregisterPushToken(): Promise<void> {
    const token = lastPushToken;
    if (!token) return;

    try {
      if (await usesRestBackend()) {
        await apiClient.delete('/api/device/fcm-token', {
          data: {
            token,
            platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
          },
        });
        if (__DEV__) {
          console.log('[push] Token backend\'den silindi.');
        }
      }
    } catch (err) {
      if (__DEV__) {
        console.warn('[push] Token silinemedi:', err);
      }
    } finally {
      lastPushToken = null;
    }
  },

  resetSession() {
    initializedForUser = null;
    lastPushToken = null;
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
