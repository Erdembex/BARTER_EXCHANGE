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
import { ApplicationMessage, UserRole } from '@/types';
import { messagesRepository } from '@/features/messages';
import { formatRelativeTime } from '@/lib/dateUtils';
import { Colors, Typography, Spacing, Radius } from '@/theme';

interface ApplicationMessageThreadProps {
  applicationId: string;
  currentUserId: string;
  currentUserRole: UserRole;
}

export function ApplicationMessageThread({
  applicationId,
  currentUserId,
  currentUserRole,
}: ApplicationMessageThreadProps) {
  const [messages, setMessages] = useState<ApplicationMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const listRef = useRef<FlatList<ApplicationMessage>>(null);
  const prevCount = useRef(0);

  const scrollToEnd = useCallback(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  useEffect(() => {
    const unsubscribe = messagesRepository.subscribe(applicationId, (list) => {
      setMessages(list);
      setLoading(false);
    });
    return unsubscribe;
  }, [applicationId]);

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
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : 'Mesaj gönderilemedi.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Mesajlar</Text>
      <Text style={styles.subtitle}>
        İşletme ve aday bu başvuru hakkında yazışabilir.
      </Text>

      {messages.length === 0 ? (
        <Text style={styles.empty}>Henüz mesaj yok — ilk mesajı sen gönder.</Text>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const mine = item.senderId === currentUserId;
            return (
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>
                  {item.text}
                </Text>
                <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>
                  {formatRelativeTime(item.createdAt) || 'Az önce'}
                </Text>
              </View>
            );
          }}
        />
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
              <Text style={styles.sendText}>Gönder</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing[3],
  },
  loading: { paddingVertical: Spacing[6], alignItems: 'center' },
  title: { ...Typography.labelLarge, color: Colors.textPrimary },
  subtitle: { ...Typography.caption, color: Colors.textMuted, lineHeight: 18 },
  empty: { ...Typography.bodySmall, color: Colors.textTertiary, textAlign: 'center' },
  error: { ...Typography.caption, color: Colors.error, marginBottom: Spacing[1] },
  list: { gap: Spacing[2], maxHeight: 280 },
  bubble: {
    maxWidth: '85%',
    padding: Spacing[3],
    borderRadius: Radius.lg,
    gap: 4,
  },
  bubbleMine: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bubbleText: { ...Typography.bodySmall, color: Colors.textPrimary, lineHeight: 20 },
  bubbleTextMine: { color: Colors.textOnPrimary },
  bubbleTime: { ...Typography.caption, color: Colors.textMuted },
  bubbleTimeMine: { color: Colors.textSecondary },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    ...Typography.bodySmall,
    color: Colors.textPrimary,
  },
  sendBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    minWidth: 72,
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.45 },
  sendText: { ...Typography.labelMedium, color: Colors.textOnPrimary },
});
