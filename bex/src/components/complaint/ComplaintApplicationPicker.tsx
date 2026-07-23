import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {
  fetchEligibleComplaintApplications,
  fetchEligibleComplaintApplicationsBusiness,
  type ComplaintEligibleApplicationDto,
} from '@/features/complaint/complaintsApi';
import { APPLICATION_STATUS_LABELS } from '@/constants/taskLabels';
import type { ApplicationStatus } from '@/types';
import { Colors, Typography, Spacing, Radius } from '@/theme';

interface ComplaintApplicationPickerProps {
  mode: 'individual' | 'business';
  businessProfileIdFilter?: string;
  selectedId: string;
  selectedLabel: string;
  onSelect: (item: ComplaintEligibleApplicationDto) => void;
  onClear?: () => void;
}

const BACKEND_STATUS_MAP: Record<string, ApplicationStatus> = {
  ACCEPTED: 'approved',
  SUBMITTED: 'submitted',
  SUBMISSION_APPROVED: 'submission_approved',
  REWARDED: 'rewarded',
};

export function ComplaintApplicationPicker({
  mode,
  businessProfileIdFilter,
  selectedId,
  selectedLabel,
  onSelect,
  onClear,
}: ComplaintApplicationPickerProps) {
  const [items, setItems] = useState<ComplaintEligibleApplicationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list =
        mode === 'individual'
          ? await fetchEligibleComplaintApplications(businessProfileIdFilter)
          : await fetchEligibleComplaintApplicationsBusiness();
      setItems(list);
    } catch {
      setItems([]);
      setError('Uygun görevler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [mode, businessProfileIdFilter]);

  useEffect(() => {
    load();
  }, [load]);

  if (selectedId) {
    return (
      <View style={styles.selectedCard}>
        <View style={styles.selectedText}>
          <Text style={styles.selectedLabel}>Seçilen görev</Text>
          <Text style={styles.selectedName}>{selectedLabel}</Text>
        </View>
        {onClear ? (
          <TouchableOpacity onPress={onClear} hitSlop={8}>
            <Text style={styles.changeLink}>Değiştir</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>
        Yalnızca işletmenin onayladığı görevlerin için şikayet oluşturabilirsin. Kupon şart değil.
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing[3] }} />
      ) : items.length === 0 ? (
        <Text style={styles.empty}>
          {businessProfileIdFilter
            ? 'Bu işletmede onaylanmış görevin yok veya bu görev için zaten şikayetin var.'
            : 'Şikayet edebileceğin onaylanmış görev bulunamadı.'}
        </Text>
      ) : (
        <ScrollView style={styles.scroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
          {items.map((item) => {
            const mapped = BACKEND_STATUS_MAP[item.status?.toUpperCase?.() ?? ''] ?? null;
            const statusLabel = mapped
              ? APPLICATION_STATUS_LABELS[mapped]
              : item.status;
            const subtitle =
              mode === 'individual'
                ? `${item.businessName} · ${statusLabel}`
                : `${item.individualDisplayName} · ${statusLabel}`;
            return (
              <TouchableOpacity
                key={item.applicationId}
                style={styles.row}
                onPress={() => onSelect(item)}
              >
                <Text style={styles.title}>{item.listingTitle}</Text>
                <Text style={styles.meta}>{subtitle}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing[2] },
  hint: { ...Typography.bodySmall, color: Colors.textMuted, lineHeight: 20 },
  error: { ...Typography.bodySmall, color: Colors.error },
  empty: { ...Typography.bodySmall, color: Colors.textMuted, paddingVertical: Spacing[2] },
  scroll: { maxHeight: 260 },
  row: {
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 2,
  },
  title: { ...Typography.labelMedium, color: Colors.textPrimary },
  meta: { ...Typography.caption, color: Colors.textMuted },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.primary + '44',
    gap: Spacing[3],
  },
  selectedText: { flex: 1, gap: 2 },
  selectedLabel: { ...Typography.caption, color: Colors.textMuted },
  selectedName: { ...Typography.labelLarge, color: Colors.textPrimary },
  changeLink: { ...Typography.labelMedium, color: Colors.primary },
});
