import { Client, IMessage } from '@stomp/stompjs';
import { getWebSocketBaseUrl } from '@/lib/api/config';
import { getAccessToken } from '@/lib/auth/tokenStorage';

export type StompMessagePayload = {
  id: string;
  conversationId?: string;
  senderId?: string;
  content?: string;
  createdAt?: string;
};

export async function subscribeConversationTopic(
  conversationId: string,
  onEvent: () => void
): Promise<() => void> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Oturum bulunamadı.');
  }

  let disposed = false;
  const wsUrl = `${getWebSocketBaseUrl()}/ws-native?token=${encodeURIComponent(token)}`;

  const client = new Client({
    brokerURL: wsUrl,
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      if (disposed) return;
      client.subscribe(`/topic/conversation/${conversationId}`, (_message: IMessage) => {
        onEvent();
      });
    },
    onStompError: () => {
      // Polling yedeği devreye girer
    },
  });

  client.activate();

  return () => {
    disposed = true;
    void client.deactivate();
  };
}
