import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { useBusiness } from '@/features/business/useBusiness';
import {
  ConversationPreview,
  loadBusinessMessagingInbox,
  loadMessagingInbox,
} from '@/features/messages/inboxService';

export type MessagingAudience = 'user' | 'business';

export function useMessagingInbox(audience: MessagingAudience = 'user') {
  const { firebaseUser } = useAuthStore();
  const { business } = useBusiness();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (audience === 'business') {
      if (!business?.id) {
        setConversations([]);
        setIsUnlocked(false);
        setTotalUnread(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const result = await loadBusinessMessagingInbox(business.id);
        setConversations(result.conversations);
        setIsUnlocked(result.isUnlocked);
        setTotalUnread(result.totalUnread);
      } catch {
        setConversations([]);
        setIsUnlocked(false);
        setTotalUnread(0);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!firebaseUser) {
      setConversations([]);
      setIsUnlocked(false);
      setTotalUnread(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await loadMessagingInbox(firebaseUser.uid);
      setConversations(result.conversations);
      setIsUnlocked(result.isUnlocked);
      setTotalUnread(result.totalUnread);
    } catch {
      setConversations([]);
      setIsUnlocked(false);
      setTotalUnread(0);
    } finally {
      setLoading(false);
    }
  }, [audience, business?.id, firebaseUser]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  return { conversations, isUnlocked, totalUnread, loading, refresh };
}
