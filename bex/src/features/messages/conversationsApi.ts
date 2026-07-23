import axios from 'axios';
import { Timestamp } from 'firebase/firestore';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import { getSessionClaims, hasRestAuthSession } from '@/lib/auth/sessionClaims';
import { ApplicationMessage, UserRole } from '@/types';

type ConversationDto = {
  id: string;
  applicationId?: string;
  businessUserId?: string;
  individualUserId?: string;
  status?: string;
  unreadCount?: number;
  createdAt?: string;
};

type MessageDto = {
  id: string;
  conversationId?: string;
  senderId?: string;
  messageType?: string;
  content?: string;
  createdAt?: string;
  isRead?: boolean;
};

type MessagesPageDto = {
  content?: MessageDto[];
  nextCursor?: string | null;
  hasMore?: boolean;
};

const conversationCache = new Map<string, string>();

function toTimestamp(value?: string): Timestamp {
  if (!value) return Timestamp.now();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? Timestamp.now() : Timestamp.fromDate(date);
}

function mapMessage(
  dto: MessageDto,
  applicationId: string,
  currentUserId?: string,
  currentUserType?: string
): ApplicationMessage {
  const senderId = String(dto.senderId ?? '');
  const isMine = !!currentUserId && senderId === currentUserId;
  let senderRole: UserRole = 'user';
  if (isMine) {
    senderRole = currentUserType === 'BUSINESS' ? 'business' : 'user';
  } else {
    senderRole = currentUserType === 'BUSINESS' ? 'user' : 'business';
  }

  return {
    id: String(dto.id),
    applicationId,
    senderId,
    senderRole,
    text: dto.content?.trim() ?? '',
    createdAt: toTimestamp(dto.createdAt),
  };
}

function mapMessagesError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 403 || status === 404) {
      return new Error('Bu başvuru için mesajlaşma henüz açılmadı. Başvuru onaylandıktan sonra yazışabilirsiniz.');
    }
    return new Error(getApiErrorMessage(error, fallback));
  }
  if (error instanceof Error && error.message) return error;
  return new Error(fallback);
}

export async function usesConversationsRest(): Promise<boolean> {
  return hasRestAuthSession();
}

export async function fetchConversationParticipants(
  applicationId: string
): Promise<{ businessUserId: string; individualUserId: string } | null> {
  try {
    const { data } = await apiClient.get<ConversationDto>(
      `/api/conversations/by-application/${applicationId}`
    );
    const businessUserId = String(data.businessUserId ?? '');
    const individualUserId = String(data.individualUserId ?? '');
    if (!businessUserId || !individualUserId) return null;
    return { businessUserId, individualUserId };
  } catch {
    return null;
  }
}

async function resolveConversationId(applicationId: string): Promise<string | null> {
  const cached = conversationCache.get(applicationId);
  if (cached) return cached;

  try {
    const { data } = await apiClient.get<ConversationDto>(
      `/api/conversations/by-application/${applicationId}`
    );
    const conversationId = String(data.id);
    conversationCache.set(applicationId, conversationId);
    return conversationId;
  } catch (error) {
    if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 404)) {
      return null;
    }
    throw mapMessagesError(error, 'Konuşma yüklenemedi.');
  }
}

export async function fetchMessagesByApplication(
  applicationId: string
): Promise<ApplicationMessage[]> {
  const conversationId = await resolveConversationId(applicationId);
  if (!conversationId) return [];

  const claims = await getSessionClaims();
  const currentUserId = claims?.sub ?? undefined;
  const currentUserType = claims?.userType;

  try {
    const { data } = await apiClient.get<MessagesPageDto | MessageDto[]>(
      `/api/conversations/${conversationId}/messages`,
      { params: { pageSize: 50 } }
    );

    const rows = Array.isArray(data)
      ? data
      : Array.isArray(data?.content)
        ? data.content
        : [];

    return rows
      .map((row) => mapMessage(row, applicationId, currentUserId, currentUserType))
      .sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
  } catch (error) {
    throw mapMessagesError(error, 'Mesajlar yüklenemedi.');
  }
}

export async function sendMessageByApplication(
  applicationId: string,
  text: string
): Promise<ApplicationMessage> {
  const conversationId = await resolveConversationId(applicationId);
  if (!conversationId) {
    throw new Error('Bu başvuru için mesajlaşma henüz açılmadı. Başvuru onaylandıktan sonra yazışabilirsiniz.');
  }

  try {
    const claims = await getSessionClaims();
    const { data } = await apiClient.post<MessageDto>(
      `/api/conversations/${conversationId}/messages`,
      { content: text.trim() }
    );
    return mapMessage(data, applicationId, claims?.sub, claims?.userType);
  } catch (error) {
    throw mapMessagesError(error, 'Mesaj gönderilemedi.');
  }
}

export function clearConversationCache(applicationId?: string): void {
  if (applicationId) {
    conversationCache.delete(applicationId);
    return;
  }
  conversationCache.clear();
}
