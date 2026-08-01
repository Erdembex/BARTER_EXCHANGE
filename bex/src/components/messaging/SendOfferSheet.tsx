import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Input, Button } from '@/components/ui';
import { SendChatOfferInput } from '@/features/messages/offersApi';
import { TaskCategory } from '@/types';
import { ALL_CATEGORIES, useCategoryLabels } from '@/constants/taskLabels';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { useTranslation } from '@/i18n';

type SendOfferSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: SendChatOfferInput) => Promise<void>;
  loading?: boolean;
};

export function SendOfferSheet({ visible, onClose, onSubmit, loading }: SendOfferSheetProps) {
  const { t } = useTranslation();
  const CATEGORY_LABELS = useCategoryLabels();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('design');
  const [estimatedHours, setEstimatedHours] = useState('4');
  const [rewardDescription, setRewardDescription] = useState('');
  const [rewardQuantity, setRewardQuantity] = useState('1');
  const [validityDays, setValidityDays] = useState('30');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const reset = () => {
    setTitle('');
    setDescription('');
    setCategory('design');
    setEstimatedHours('4');
    setRewardDescription('');
    setRewardQuantity('1');
    setValidityDays('30');
    setNote('');
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    setError('');
    const hours = parseInt(estimatedHours, 10);
    const qty = parseInt(rewardQuantity, 10);
    const days = parseInt(validityDays, 10);

    if (title.trim().length < 5) {
      setError(t('sendOfferSheet.titleMinError'));
      return;
    }
    if (description.trim().length < 20) {
      setError(t('sendOfferSheet.descMinError'));
      return;
    }
    if (!rewardDescription.trim()) {
      setError(t('sendOfferSheet.rewardRequiredError'));
      return;
    }
    if (!hours || hours < 1) {
      setError(t('sendOfferSheet.hoursMinError'));
      return;
    }
    if (!qty || qty < 1) {
      setError(t('sendOfferSheet.qtyMinError'));
      return;
    }
    if (!days || days < 1) {
      setError(t('sendOfferSheet.daysMinError'));
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        estimatedHours: hours,
        rewardDescription: rewardDescription.trim(),
        rewardQuantity: qty,
        validityDays: days,
        note: note.trim() || undefined,
      });
      reset();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('sendOfferSheet.sendFailed'));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={styles.sheet}>
          <Text style={styles.title}>{t('sendOfferSheet.title')}</Text>
          <Text style={styles.subtitle}>
            {t('sendOfferSheet.subtitle')}
          </Text>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
            <Input label={t('sendOfferSheet.jobTitleLabel')} value={title} onChangeText={setTitle} placeholder={t('sendOfferSheet.jobTitlePlaceholder')} />

            <Input
              label={t('sendOfferSheet.jobDescLabel')}
              value={description}
              onChangeText={setDescription}
              placeholder={t('sendOfferSheet.jobDescPlaceholder')}
              multiline
            />

            <Text style={styles.label}>{t('sendOfferSheet.categoryLabel')}</Text>
            <View style={styles.chips}>
              {ALL_CATEGORIES.slice(0, 6).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, category === cat && styles.chipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                    {CATEGORY_LABELS[cat]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.row}>
              <View style={styles.half}>
                <Input
                  label={t('sendOfferSheet.estimatedHoursLabel')}
                  value={estimatedHours}
                  onChangeText={setEstimatedHours}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.half}>
                <Input
                  label={t('sendOfferSheet.validityDaysLabel')}
                  value={validityDays}
                  onChangeText={setValidityDays}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <Input
              label={t('sendOfferSheet.rewardDescLabel')}
              value={rewardDescription}
              onChangeText={setRewardDescription}
              placeholder={t('sendOfferSheet.rewardDescPlaceholder')}
            />

            <Input
              label={t('sendOfferSheet.rewardQtyLabel')}
              value={rewardQuantity}
              onChangeText={setRewardQuantity}
              keyboardType="number-pad"
            />

            <Input
              label={t('sendOfferSheet.noteLabel')}
              value={note}
              onChangeText={setNote}
              placeholder={t('sendOfferSheet.notePlaceholder')}
              multiline
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Button title={t('sendOfferSheet.submit')} onPress={handleSubmit} loading={loading} />
            <Button title={t('sendOfferSheet.cancel')} variant="ghost" onPress={handleClose} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderTopWidth: 2,
    borderColor: Colors.borderGold,
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[5],
    paddingBottom: Spacing[6],
    maxHeight: '92%',
  },
  title: { ...Typography.headingMedium, color: Colors.textPrimary, fontWeight: '700' },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing[1],
    marginBottom: Spacing[4],
    lineHeight: 22,
  },
  form: { gap: Spacing[3], paddingBottom: Spacing[4] },
  label: { ...Typography.labelMedium, color: Colors.textPrimary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  chip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  chipText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: Colors.accent, fontWeight: '700' },
  row: { flexDirection: 'row', gap: Spacing[3] },
  half: { flex: 1 },
  error: { ...Typography.caption, color: Colors.error },
});
