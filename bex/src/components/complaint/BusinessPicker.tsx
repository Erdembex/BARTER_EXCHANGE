import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Input } from '@/components/ui';
import {
  searchBusinessProfiles,
  type BusinessSearchHit,
} from '@/features/business/businessProfileApi';
import { BUSINESS_CATEGORY_LABELS } from '@/constants/businessLabels';
import { Colors, Typography, Spacing, Radius } from '@/theme';

interface BusinessPickerProps {
  selectedId: string;
  selectedName: string;
  onSelect: (business: BusinessSearchHit) => void;
  onClear?: () => void;
}

export function BusinessPicker({
  selectedId,
  selectedName,
  onSelect,
  onClear,
}: BusinessPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BusinessSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(async (term: string) => {
    setLoading(true);
    setError(null);
    try {
      const hits = await searchBusinessProfiles(term);
      setResults(hits);
    } catch {
      setResults([]);
      setError('İşletmeler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runSearch('');
  }, [runSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      runSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  return (
    <View style={styles.wrap}>
      {selectedId ? (
        <View style={styles.selectedCard}>
          <View style={styles.selectedText}>
            <Text style={styles.selectedLabel}>Seçilen işletme</Text>
            <Text style={styles.selectedName}>{selectedName}</Text>
          </View>
          {onClear ? (
            <TouchableOpacity onPress={onClear} hitSlop={8}>
              <Text style={styles.changeLink}>Değiştir</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <>
          <Input
            label="İşletme ara"
            value={query}
            onChangeText={setQuery}
            placeholder="İşletme adı yaz..."
            autoCapitalize="words"
            autoCorrect={false}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing[3] }} />
          ) : (
            <ScrollView
              style={styles.resultsScroll}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {results.length === 0 ? (
                <Text style={styles.empty}>
                  {query.trim().length >= 2
                    ? 'Eşleşen işletme bulunamadı.'
                    : 'Kayıtlı işletmelerden birini seç.'}
                </Text>
              ) : (
                results.map((item) => (
                  <TouchableOpacity
                    key={item.profileId}
                    style={styles.resultRow}
                    onPress={() => onSelect(item)}
                  >
                    <Text style={styles.resultName}>{item.businessName}</Text>
                    <Text style={styles.resultMeta}>
                      {BUSINESS_CATEGORY_LABELS[item.category]}
                      {item.locationLabel ? ` · ${item.locationLabel}` : ''}
                      {item.verified ? ' · ✓ Doğrulanmış' : ''}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing[2] },
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
  error: { ...Typography.bodySmall, color: Colors.error },
  empty: { ...Typography.bodySmall, color: Colors.textMuted, paddingVertical: Spacing[2] },
  resultsScroll: { maxHeight: 220 },
  resultRow: {
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 2,
  },
  resultName: { ...Typography.labelMedium, color: Colors.textPrimary },
  resultMeta: { ...Typography.caption, color: Colors.textMuted },
});
