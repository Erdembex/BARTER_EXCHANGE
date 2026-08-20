import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Button, Input } from '@/components/ui';
import { ComplaintApplicationPicker } from '@/components/complaint/ComplaintApplicationPicker';
import {
  useComplaintReasonLabels,
  ComplaintReason,
  submitIndividualComplaint,
  type ComplaintEligibleApplicationDto,
} from '@/features/complaint/complaintsApi';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

const REASON_OPTIONS: ComplaintReason[] = [
  'POOR_SERVICE',
  'FRAUD',
  'HARASSMENT',
  'COUPON_ISSUE',
  'OTHER',
];

interface IndividualComplaintSubmitFormProps {
  initialApplicationId?: string;
  initialApplicationLabel?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

export function IndividualComplaintSubmitForm({
  initialApplicationId = '',
  initialApplicationLabel = '',
  onSuccess,
  onCancel,
  showCancel = false,
}: IndividualComplaintSubmitFormProps) {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const COMPLAINT_REASON_LABELS = useComplaintReasonLabels();
  const [applicationId, setApplicationId] = useState(initialApplicationId);
  const [applicationLabel, setApplicationLabel] = useState(initialApplicationLabel);
  const [reason, setReason] = useState<ComplaintReason>('POOR_SERVICE');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = (item: ComplaintEligibleApplicationDto) => {
    setApplicationId(item.applicationId);
    setApplicationLabel(`${item.listingTitle} · ${item.individualDisplayName}`);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!applicationId.trim()) {
      setError(t('complaintForm.errorNoTaskUser'));
      return;
    }
    if (description.trim().length < 10) {
      setError(t('complaintForm.errorDescMin'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitIndividualComplaint({
        applicationId: applicationId.trim(),
        reason,
        description: description.trim(),
      });
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('complaintForm.errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.lead}>
        {t('complaintForm.userLead')}
      </Text>

      <ComplaintApplicationPicker
        mode="business"
        selectedId={applicationId}
        selectedLabel={applicationLabel}
        onSelect={handleSelect}
        onClear={() => {
          setApplicationId('');
          setApplicationLabel('');
        }}
      />

      <Text style={styles.fieldLabel}>{t('complaintForm.reasonLabel')}</Text>
      <View style={styles.reasonRow}>
        {REASON_OPTIONS.map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.reasonChip, reason === key && styles.reasonChipActive]}
            onPress={() => setReason(key)}
          >
            <Text style={[styles.reasonChipText, reason === key && styles.reasonChipTextActive]}>
              {COMPLAINT_REASON_LABELS[key]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input
        label={t('complaintForm.descriptionLabel')}
        value={description}
        onChangeText={setDescription}
        placeholder={t('complaintForm.descriptionPlaceholder')}
        multiline
        numberOfLines={5}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        {showCancel && onCancel ? (
          <Button title={t('complaintForm.cancel')} variant="outline" onPress={onCancel} style={{ flex: 1 }} />
        ) : null}
        <Button
          title={t('complaintForm.submit')}
          onPress={handleSubmit}
          loading={submitting}
          style={showCancel ? { flex: 1 } : undefined}
        />
      </View>
    </View>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  wrap: { gap: Spacing[4] },
  lead: { ...Typography.bodySmall, color: Colors.textMuted, lineHeight: 20 },
  fieldLabel: { ...Typography.labelMedium, color: Colors.textPrimary },
  reasonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  reasonChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
  },
  reasonChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  reasonChipText: { ...Typography.caption, color: Colors.textSecondary },
  reasonChipTextActive: { color: Colors.primary, fontWeight: '700' },
  error: { ...Typography.bodySmall, color: Colors.error },
  actions: { flexDirection: 'row', gap: Spacing[2] },
}));
