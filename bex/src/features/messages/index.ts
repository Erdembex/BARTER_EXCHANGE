import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { shouldUseDemoData } from '@/lib/devMode';
import { demoStore } from '@/lib/demoStore';
import { applicationsRepository } from '@/features/data/applicationsRepository';
import { businessesRepository } from '@/features/data/businessesRepository';
import { usersRepository } from '@/features/data/usersRepository';
import { notifyUser } from '@/features/notifications/notificationsRepository';
import { ApplicationMessage, ApplicationStatus, UserRole } from '@/types';

const MESSAGE_STATUSES: ApplicationStatus[] = [
  'pending',
  'approved',
  'submitted',
  'submission_approved',
];

export function canUseApplicationMessages(status: ApplicationStatus): boolean {
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
  if (senderId === app.userId) {
    const business = await businessesRepository.getById(app.businessId);
    recipientId = business?.ownerUid ?? null;
  } else {
    recipientId = app.userId;
  }

  if (!recipientId || recipientId === senderId) return;

  const senderName = await usersRepository.getDisplayName(senderId);
  const body =
    preview.length > 80 ? `${preview.slice(0, 77)}...` : preview;

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
    if (shouldUseDemoData()) {
      return demoStore.getMessagesByApplication(applicationId);
    }
    try {
      const q = query(
        collection(db, 'applications', applicationId, 'messages'),
        orderBy('createdAt', 'asc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as ApplicationMessage
      );
    } catch {
      return demoStore.getMessagesByApplication(applicationId);
    }
  },

  subscribe(
    applicationId: string,
    onUpdate: (messages: ApplicationMessage[]) => void
  ): Unsubscribe {
    if (shouldUseDemoData()) {
      onUpdate(demoStore.getMessagesByApplication(applicationId));
      const interval = setInterval(() => {
        onUpdate(demoStore.getMessagesByApplication(applicationId));
      }, 4000);
      return () => clearInterval(interval);
    }

    const q = query(
      collection(db, 'applications', applicationId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(
      q,
      (snap) => {
        onUpdate(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ApplicationMessage)
        );
      },
      () => {
        onUpdate(demoStore.getMessagesByApplication(applicationId));
      }
    );
  },

  async send(
    applicationId: string,
    senderId: string,
    senderRole: UserRole,
    text: string
  ): Promise<ApplicationMessage> {
    const trimmed = text.trim();
    if (!trimmed) throw new Error('Mesaj boş olamaz.');

    const payload = {
      applicationId,
      senderId,
      senderRole,
      text: trimmed,
    };

    let message: ApplicationMessage;

    if (shouldUseDemoData()) {
      message = demoStore.addMessage(payload);
    } else {
      const ref = await addDoc(
        collection(db, 'applications', applicationId, 'messages'),
        { ...payload, createdAt: serverTimestamp() }
      );
      message = {
        id: ref.id,
        ...payload,
        createdAt: { toMillis: () => Date.now() } as ApplicationMessage['createdAt'],
      };
    }

    await notifyMessageRecipient(applicationId, senderId, trimmed);
    return message;
  },
};
