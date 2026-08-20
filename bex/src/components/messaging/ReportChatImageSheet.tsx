import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  buildImageReportDescription,
  MESSAGE_IMAGE_REPORT_LABELS,
  MESSAGE_IMAGE_REPORT_REASONS,
  MessageImageReportReason,
  reportChatImage,
} from '@/features/messages/messageImageReportsApi';
import { Button } from '@/components/ui';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

type ReportChatImageSheetProps = {
  visible: boolean;
  conversationId: string | null;
  messageId: string | null;
  onClose: () => void;
  onSubmitted: () => void;
};

export function ReportChatImageSheet({
  visible,
  conversationId,
  messageId,
  onClose,
  onSubmitted,
}: ReportChatImageSheetProps) {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const [reason, setReason] = useState<MessageImageReportReason | null>(null);
  const [customText, setCustomText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setReason(null);
      setCustomText('');
      setError(null);
      setLoading(false);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!conversationId || !messageId || !reason) {
      setError(t('reportChatImageSheet.reasonRequired'));
      return;
    }
    if (reason === 'OTHER' && customText.trim().length < 10) {
      setError(t('reportChatImageSheet.otherMinChars'));
      return;
    }

    const description = buildImageReportDescription(reason, customText);
    if (description.length < 10) {
      setError(t('reportChatImageSheet.descMin'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await reportChatImage({
        conversationId,
        messageId,
        reason,
        description,
      });
      onSubmitted();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('reportChatImageSheet.sendFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <Text style={styles.title}>{t('reportChatImageSheet.title')}</Text>
          <Text style={styles.subtitle}>
            {t('reportChatImageSheet.subtitle')}
          </Text>

          <ScrollView style={styles.reasonList} keyboardShouldPersistTaps="handled">
            {MESSAGE_IMAGE_REPORT_REASONS.map((key) => {
              const active = reason === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.reasonChip, active && styles.reasonChipActive]}
                  onPress={() => setReason(key)}
                >
                  <Text style={[styles.reasonText, active && styles.reasonTextActive]}>
                    {MESSAGE_IMAGE_REPORT_LABELS[key]}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {reason === 'OTHER' ? (
              <TextInput
                style={styles.input}
                value={customText}
                onChangeText={setCustomText}
                placeholder={t('reportChatImageSheet.otherPlaceholder')}
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={4}
                maxLength={2000}
                textAlignVertical="top"
              />
            ) : reason ? (
              <TextInput
                style={styles.inputOptional}
                value={customText}
                onChangeText={setCustomText}
                placeholder={t('reportChatImageSheet.optionalPlaceholder')}
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                maxLength={500}
                textAlignVertical="top"
              />
            ) : null}
          </ScrollView>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Button title={t('reportChatImageSheet.cancel')} variant="ghost" onPress={onClose} disabled={loading} />
            <Button
              title={loading ? t('reportChatImageSheet.sending') : t('reportChatImageSheet.submit')}
              variant="danger"
              onPress={handleSubmit}
              disabled={loading || !reason}
              loading={loading}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing[5],
    maxHeight: '88%',
    gap: Spacing[3],
  },
  title: { ...Typography.headingMedium, color: Colors.textPrimary },
  subtitle: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
  reasonList: { maxHeight: 360 },
  reasonChip: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginBottom: Spacing[2],
  },
  reasonChipActive: {
    borderColor: Colors.error,
    backgroundColor: Colors.error + '12',
  },
  reasonText: { ...Typography.bodyMedium, color: Colors.textPrimary },
  reasonTextActive: { color: Colors.error, fontWeight: '700' },
  input: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing[3],
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    backgroundColor: Colors.surfaceSecondary,
    marginTop: Spacing[1],
  },
  inputOptional: {
    minHeight: 72,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.lg,
    padding: Spacing[3],
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    backgroundColor: Colors.surfaceSecondary,
    marginTop: Spacing[1],
  },
  error: { ...Typography.caption, color: Colors.error },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing[2],
  },
}));
