import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  fetchSwapOfferMessages,
  sendSwapOfferMessage,
  SwapOfferMessage,
} from '@/features/trade/swapOfferChatApi';
import { Typography, Spacing, Radius, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

export default function SwapChatScreen() {
  const { offerId } = useLocalSearchParams<{ offerId: string }>();
  const { t } = useTranslation();
  const Colors = useThemeColors();
  const styles = useMemoStyles(Colors);
  const [messages, setMessages] = useState<SwapOfferMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const load = useCallback(async () => {
    if (!offerId) return;
    try {
      const list = await fetchSwapOfferMessages(offerId);
      setMessages(list);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [offerId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  const handleSend = async () => {
    const body = text.trim();
    if (!body || !offerId || sending) return;
    setSending(true);
    try {
      const msg = await sendSwapOfferMessage(offerId, body);
      setMessages((prev) => [...prev, msg]);
      setText('');
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      // toast optional
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('swapChat.title')}</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing[8] }} />
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={80}
        >
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.empty}>{t('swapChat.empty')}</Text>}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.bubble,
                  item.mine ? styles.bubbleMine : styles.bubbleTheirs,
                ]}
              >
                <Text style={[styles.bubbleText, item.mine && styles.bubbleTextMine]}>
                  {item.body}
                </Text>
              </View>
            )}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          />
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder={t('swapChat.placeholder')}
              placeholderTextColor={Colors.textMuted}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
              onPress={() => void handleSend()}
              disabled={!text.trim() || sending}
            >
              <Text style={styles.sendText}>{t('swapChat.send')}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

function useMemoStyles(Colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.background },
    flex: { flex: 1 },
    header: {
      paddingHorizontal: Spacing[5],
      paddingTop: Spacing[3],
      gap: Spacing[2],
      borderBottomWidth: 1,
      borderBottomColor: Colors.borderLight,
      paddingBottom: Spacing[3],
    },
    back: { ...Typography.labelMedium, color: Colors.primary },
    title: { ...Typography.headingMedium, color: Colors.textPrimary },
    list: { padding: Spacing[4], gap: Spacing[2], flexGrow: 1 },
    empty: {
      ...Typography.bodyMedium,
      color: Colors.textMuted,
      textAlign: 'center',
      marginTop: Spacing[8],
    },
    bubble: {
      maxWidth: '82%',
      padding: Spacing[3],
      borderRadius: Radius.lg,
    },
    bubbleMine: {
      alignSelf: 'flex-end',
      backgroundColor: Colors.primary,
    },
    bubbleTheirs: {
      alignSelf: 'flex-start',
      backgroundColor: Colors.surfaceSecondary,
    },
    bubbleText: { ...Typography.bodyMedium, color: Colors.textPrimary },
    bubbleTextMine: { color: Colors.textOnPrimary },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: Spacing[2],
      padding: Spacing[4],
      borderTopWidth: 1,
      borderTopColor: Colors.borderLight,
    },
    input: {
      flex: 1,
      minHeight: 44,
      maxHeight: 120,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing[3],
      paddingVertical: Spacing[2],
      ...Typography.bodyMedium,
      color: Colors.textPrimary,
      backgroundColor: Colors.card,
    },
    sendBtn: {
      backgroundColor: Colors.primary,
      paddingHorizontal: Spacing[4],
      paddingVertical: Spacing[3],
      borderRadius: Radius.lg,
    },
    sendBtnDisabled: { opacity: 0.45 },
    sendText: { ...Typography.labelMedium, color: Colors.textOnPrimary },
  });
}
