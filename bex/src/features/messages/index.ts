import type { Unsubscribe } from 'firebase/firestore';
import { shouldUseDemoData } from '@/lib/devMode';
import { demoStore } from '@/lib/demoStore';
import { applicationsRepository } from '@/features/data/applicationsRepository';
import { businessesRepository } from '@/features/data/businessesRepository';
import { usersRepository } from '@/features/data/usersRepository';
import { notifyUser } from '@/features/notifications/notificationsRepository';
import {
  fetchMessagesByApplication,
  fetchConversationParticipants,
  sendMessageByApplication,
  usesConversationsRest,
} from './conversationsApi';
import { ApplicationMessage, ApplicationStatus, UserRole } from '@/types';

const MESSAGE_STATUSES: ApplicationStatus[] = [
  'approved',
  'submitted',
  'submission_approved',
];

export function canUseApplicationMessages(status: ApplicationStatus): boolean {
  if (shouldUseDemoData()) {
    return ['pending', 'approved', 'submitted', 'submission_approved'].includes(status);
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
    const poll = async () => {
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

    poll();
    const interval = setInterval(poll, 4000);
    return () => {
      active = false;
      clearInterval(interval);
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
};
