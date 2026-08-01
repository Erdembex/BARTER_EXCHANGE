import axios from 'axios';
import { apiClient, getApiErrorMessage } from '@/lib/api';

export type MessageImageReportReason =
  | 'INAPPROPRIATE'
  | 'HARASSMENT'
  | 'FRAUD'
  | 'SPAM'
  | 'OTHER';

export const MESSAGE_IMAGE_REPORT_LABELS: Record<MessageImageReportReason, string> = {
  INAPPROPRIATE: 'Uygunsuz içerik',
  HARASSMENT: 'Taciz / rahatsız edici',
  FRAUD: 'Dolandırıcılık / tehdit',
  SPAM: 'Spam / reklam',
  OTHER: 'Diğer',
};

export const MESSAGE_IMAGE_REPORT_REASONS: MessageImageReportReason[] = [
  'INAPPROPRIATE',
  'HARASSMENT',
  'FRAUD',
  'SPAM',
  'OTHER',
];

function mapError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    return new Error(getApiErrorMessage(error, fallback));
  }
  if (error instanceof Error && error.message) return error;
  return new Error(fallback);
}

export async function reportChatImage(payload: {
  conversationId: string;
  messageId: string;
  reason: MessageImageReportReason;
  description: string;
}): Promise<void> {
  try {
    await apiClient.post(
      `/api/conversations/${payload.conversationId}/messages/${payload.messageId}/report-image`,
      {
        reason: payload.reason,
        description: payload.description.trim(),
      }
    );
  } catch (error) {
    throw mapError(error, 'Görsel şikayet edilemedi.');
  }
}

export function buildImageReportDescription(
  reason: MessageImageReportReason,
  customText: string
): string {
  if (reason === 'OTHER') {
    return customText.trim();
  }
  const label = MESSAGE_IMAGE_REPORT_LABELS[reason];
  const extra = customText.trim();
  if (extra.length >= 10) {
    return `${label}. ${extra}`;
  }
  return `${label}. Sohbet görseli şikayet edildi.`;
}
