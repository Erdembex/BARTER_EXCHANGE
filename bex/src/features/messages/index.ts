import type { Unsubscribe } from 'firebase/firestore';
import { AppState, AppStateStatus } from 'react-native';
import { shouldUseDemoData } from '@/lib/devMode';
import { demoStore } from '@/lib/demoStore';
import { applicationsRepository } from '@/features/data/applicationsRepository';
import { businessesRepository } from '@/features/data/businessesRepository';
import { usersRepository } from '@/features/data/usersRepository';
import { notifyUser } from '@/features/notifications/notificationsRepository';
import {
  fetchMessagesByApplication,
  fetchConversationParticipants,
  resolveConversationId,
  sendMessageByApplication,
  sendImageMessageByApplication,
  usesConversationsRest,
} from './conversationsApi';
import { ApplicationMessage, ApplicationStatus, UserRole } from '@/types';

// Kupon alındıktan sonra da (rewarded) sohbet açık kalır — taraflar artık tanışıyor,
// işletme sonraki görevleri doğrudan bu kişiye ilan olarak gönderebilir. Sohbet yalnızca
// biri diğerini engellerse kapanır (engelleme akışı ayrıca yönetilir).
const MESSAGE_STATUSES: ApplicationStatus[] = [
  'pending',
  'approved',
  'submitted',
  'submission_approved',
  'rewarded',
];

const POLL_MS_ACTIVE = 2500;
const POLL_MS_BACKGROUND = 10000;

export function canUseApplicationMessages(status: ApplicationStatus): boolean {
  if (shouldUseDemoData()) {
    return ['pending', 'approved', 'submitted', 'submission_approved', 'rewarded'].includes(
      status
    );
  }
  return MESSAGE_STATUSES.includes(status);
}

async function notifyMessageRecipient(
  applicationId: string,
  senderId: string,
  preview: string
): Promise<void> {
  const app = await applicationsRepository.getById(applicationId);
  if (!app) return;

  let recipientId: string | null = null;

  if (await usesConversationsRest()) {
    const participants = await fetchConversationParticipants(applicationId);
    if (participants) {
      recipientId =
        senderId === participants.individualUserId || senderId === app.userId
          ? participants.businessUserId
          : participants.individualUserId;
    }
  }

  if (!recipientId) {
    if (senderId === app.userId) {
      const business = await businessesRepository.getById(app.businessId);
      recipientId = business?.ownerUid ?? null;
    } else {
      recipientId = app.userId;
    }
  }

  if (!recipientId || recipientId === senderId) return;

  const senderName = await usersRepository.getDisplayName(senderId);
  const body = preview.length > 80 ? `${preview.slice(0, 77)}...` : preview;

  await notifyUser({
    userId: recipientId,
    title: 'Yeni mesaj',
    body: `${senderName}: ${body}`,
    type: 'message',
    data: { applicationId },
    showLocalForUserId: recipientId,
  });
}

export const messagesRepository = {
  async getByApplication(applicationId: string): Promise<ApplicationMessage[]> {
    if (await usesConversationsRest()) {
      return fetchMessagesByApplication(applicationId);
    }

    if (shouldUseDemoData()) {
      return demoStore.getMessagesByApplication(applicationId);
    }

    return [];
  },

  subscribe(
    applicationId: string,
    onUpdate: (messages: ApplicationMessage[]) => void
  ): Unsubscribe {
    let active = true;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let cleanupStomp: (() => void) | undefined;
    let appState: AppStateStatus = AppState.currentState;

    const refresh = async () => {
      if (!active) return;
      try {
        if (await usesConversationsRest()) {
          const messages = await fetchMessagesByApplication(applicationId);
          if (active) onUpdate(messages);
        } else if (shouldUseDemoData()) {
          if (active) onUpdate(demoStore.getMessagesByApplication(applicationId));
        } else if (active) {
          onUpdate([]);
        }
      } catch {
        if (active) onUpdate([]);
      }
    };

    const schedulePolling = () => {
      if (pollInterval) clearInterval(pollInterval);
      const ms = appState === 'active' ? POLL_MS_ACTIVE : POLL_MS_BACKGROUND;
      pollInterval = setInterval(() => {
        void refresh();
      }, ms);
    };

    const appStateSub = AppState.addEventListener('change', (next) => {
      appState = next;
      if (pollInterval) schedulePolling();
      if (next === 'active') void refresh();
    });

    void (async () => {
      await refresh();
      if (!active) return;

      if (await usesConversationsRest()) {
        try {
          const conversationId = await resolveConversationId(applicationId);
          if (conversationId && active) {
            const { subscribeConversationTopic } = await import(
              '@/lib/messaging/messageStompClient'
            );
            cleanupStomp = await subscribeConversationTopic(conversationId, () => {
              void refresh();
            });
          }
        } catch {
          // STOMP başarısız — yalnızca polling
        }
      }

      if (active) schedulePolling();
    })();

    return () => {
      active = false;
      appStateSub.remove();
      if (pollInterval) clearInterval(pollInterval);
      cleanupStomp?.();
    };
  },

  async send(
    applicationId: string,
    senderId: string,
    senderRole: UserRole,
    text: string
  ): Promise<ApplicationMessage> {
    const trimmed = text.trim();
    if (!trimmed) throw new Error('Mesaj boş olamaz.');

    if (await usesConversationsRest()) {
      const message = await sendMessageByApplication(applicationId, trimmed);
      await notifyMessageRecipient(applicationId, senderId, trimmed);
      return { ...message, senderRole };
    }

    if (shouldUseDemoData()) {
      const message = demoStore.addMessage({
        applicationId,
        senderId,
        senderRole,
        text: trimmed,
      });
      await notifyMessageRecipient(applicationId, senderId, trimmed);
      return message;
    }

    throw new Error(
      'Mesaj gönderilemedi. Çıkış yapıp tekrar giriş yapın; backend\'in çalıştığından emin olun.'
    );
  },

  async sendImage(
    applicationId: string,
    senderId: string,
    senderRole: UserRole,
    mediaUrl: string,
    caption?: string
  ): Promise<ApplicationMessage> {
    if (!mediaUrl.trim()) throw new Error('Görsel seçilmedi.');

    if (await usesConversationsRest()) {
      const message = await sendImageMessageByApplication(applicationId, mediaUrl, caption);
      await notifyMessageRecipient(applicationId, senderId, caption?.trim() || '📷 Fotoğraf');
      return { ...message, senderRole };
    }

    if (shouldUseDemoData()) {
      const message = demoStore.addMessage({
        applicationId,
        senderId,
        senderRole,
        text: caption?.trim() || '📷 Fotoğraf',
        messageType: 'image',
        mediaUrl,
      });
      await notifyMessageRecipient(applicationId, senderId, caption?.trim() || '📷 Fotoğraf');
      return message;
    }

    throw new Error('Görsel gönderilemedi.');
  },
};
