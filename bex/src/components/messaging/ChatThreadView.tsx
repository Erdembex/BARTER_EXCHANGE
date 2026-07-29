import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApplicationMessage, UserRole } from '@/types';
import { messagesRepository } from '@/features/messages';
import { markConversationRead, resolveConversationId } from '@/features/messages/conversationsApi';
import { formatRelativeTime } from '@/lib/dateUtils';
import { Colors, Typography, Spacing, Radius } from '@/theme';

interface ChatThreadViewProps {
  applicationId: string;
  currentUserId: string;
  currentUserRole: UserRole;
  variant?: 'embedded' | 'fullscreen';
  peerLabel?: string;
  taskTitle?: string;
}

export function ChatThreadView({
  applicationId,
  currentUserId,
  currentUserRole,
  variant = 'fullscreen',
  peerLabel,
  taskTitle,
}: ChatThreadViewProps) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ApplicationMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const listRef = useRef<FlatList<ApplicationMessage>>(null);
  const prevCount = useRef(0);
  const isFullscreen = variant === 'fullscreen';

  const scrollToEnd = useCallback(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  const markRead = useCallback(async () => {
    try {
      const conversationId = await resolveConversationId(applicationId);
      if (conversationId) await markConversationRead(conversationId);
    } catch {
      // sessiz
    }
  }, [applicationId]);

  useEffect(() => {
    const unsubscribe = messagesRepository.subscribe(applicationId, (list) => {
      setMessages(list);
      setLoading(false);
    });
    return unsubscribe;
  }, [applicationId]);

  useFocusEffect(
    useCallback(() => {
      void messagesRepository.getByApplication(applicationId).then((list) => {
        setMessages(list);
        setLoading(false);
      });
      void markRead();
    }, [applicationId, markRead])
  );

  useEffect(() => {
    if (messages.length > prevCount.current) {
      scrollToEnd();
    }
    prevCount.current = messages.length;
  }, [messages.length, scrollToEnd]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const message = await messagesRepository.send(
        applicationId,
        currentUserId,
        currentUserRole,
        text
      );
      setMessages((prev) => [...prev, message]);
      setText('');
      scrollToEnd();
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : 'Mesaj gönderilemedi.');
    } finally {
      setSending(false);
    }
  };

  const inputBar = (
    <View
      style={[
        styles.inputBar,
        isFullscreen && { paddingBottom: Math.max(insets.bottom, Spacing[3]) },
      ]}
    >
      {sendError ? <Text style={styles.error}>{sendError}</Text> : null}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Mesaj yaz..."
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator color={Colors.textOnPrimary} size="small" />
          ) : (
            <Text style={styles.sendText}>↑</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loading, isFullscreen && styles.loadingFullscreen]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, isFullscreen && styles.rootFullscreen]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={isFullscreen ? 0 : 0}
    >
      {!isFullscreen && peerLabel ? (
        <View style={styles.embeddedHeader}>
          <Text style={styles.embeddedTitle}>Mesajlar</Text>
          <Text style={styles.embeddedSubtitle}>
            {peerLabel}
            {taskTitle ? ` · ${taskTitle}` : ''}
          </Text>
        </View>
      ) : null}

      {messages.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>Sohbet başlasın</Text>
          <Text style={styles.emptyText}>
            {peerLabel ?? 'İşletme'} ile bu görev hakkında yazışmaya başlayabilirsin.
          </Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          style={isFullscreen ? styles.listFullscreen : undefined}
          contentContainerStyle={[
            styles.list,
            isFullscreen && styles.listFullscreenContent,
          ]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToEnd}
          renderItem={({ item }) => {
            const mine = item.senderId === currentUserId;
            return (
              <View style={[styles.row, mine ? styles.rowMine : styles.rowOther]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                  <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>
                    {item.text}
                  </Text>
                <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>
                  {formatRelativeTime(item.createdAt) || 'Az önce'}
                  {mine && item.isRead ? ' · Okundu' : ''}
                </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {inputBar}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: Spacing[3],
  },
  rootFullscreen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loading: {
    paddingVertical: Spacing[8],
    alignItems: 'center',
  },
  loadingFullscreen: {
    flex: 1,
    justifyContent: 'center',
  },
  embeddedHeader: {
    gap: 2,
  },
  embeddedTitle: { ...Typography.labelLarge, color: Colors.textPrimary },
  embeddedSubtitle: { ...Typography.caption, color: Colors.textMuted, lineHeight: 18 },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[8],
    gap: Spacing[2],
  },
  emptyIcon: { fontSize: 40, marginBottom: Spacing[2] },
  emptyTitle: { ...Typography.labelLarge, color: Colors.textPrimary },
  emptyText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  list: {
    gap: Spacing[2],
    paddingVertical: Spacing[2],
    maxHeight: 320,
  },
  listFullscreen: {
    flex: 1,
    maxHeight: undefined,
  },
  listFullscreenContent: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[2],
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  row: {
    width: '100%',
    marginBottom: Spacing[2],
  },
  rowMine: { alignItems: 'flex-end' },
  rowOther: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderRadius: Radius.xl,
    gap: 4,
  },
  bubbleMine: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: Radius.xs,
  },
  bubbleOther: {
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: Radius.xs,
  },
  bubbleText: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  bubbleTextMine: { color: Colors.textOnPrimary },
  bubbleTime: { ...Typography.caption, color: Colors.textMuted, alignSelf: 'flex-end' },
  bubbleTimeMine: { color: 'rgba(10,10,10,0.55)' },
  inputBar: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    gap: Spacing[2],
  },
  error: { ...Typography.caption, color: Colors.error },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.45 },
  sendText: {
    ...Typography.labelLarge,
    color: Colors.textOnPrimary,
    fontWeight: '800',
    fontSize: 20,
    lineHeight: 22,
  },
});
