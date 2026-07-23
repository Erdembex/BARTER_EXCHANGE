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
  searchIndividualProfiles,
  type IndividualSearchHit,
} from '@/features/business/businessProfileApi';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { Colors, Typography, Spacing, Radius } from '@/theme';

interface IndividualPickerProps {
  selectedId: string;
  selectedName: string;
  onSelect: (individual: IndividualSearchHit) => void;
  onClear?: () => void;
}

export function IndividualPicker({
  selectedId,
  selectedName,
  onSelect,
  onClear,
}: IndividualPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IndividualSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(async (term: string) => {
    setLoading(true);
    setError(null);
    try {
      const hits = await searchIndividualProfiles(term);
      setResults(hits);
    } catch {
      setResults([]);
      setError('Kullanıcılar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runSearch('');
  }, [runSearch]);

  useEffect(() => {
    const timer = setTimeout(() => runSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  return (
    <View style={styles.wrap}>
      {selectedId ? (
        <View style={styles.selectedCard}>
          <View style={styles.selectedText}>
            <Text style={styles.selectedLabel}>Seçilen kullanıcı</Text>
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
            label="Kullanıcı ara"
            value={query}
            onChangeText={setQuery}
            placeholder="Kullanıcı adı yaz..."
            autoCapitalize="none"
            autoCorrect={false}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {loading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: Spacing[3] }} />
          ) : (
            <ScrollView style={styles.resultsScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
              {results.length === 0 ? (
                <Text style={styles.empty}>
                  {query.trim().length >= 2
                    ? 'Eşleşen kullanıcı bulunamadı.'
                    : 'Kayıtlı kullanıcılardan birini seç.'}
                </Text>
              ) : (
                results.map((item) => (
                  <TouchableOpacity
                    key={item.profileId}
                    style={styles.resultRow}
                    onPress={() => onSelect(item)}
                  >
                    <View style={styles.rowInner}>
                      <ProfileAvatar
                        name={item.username ? `@${item.username}` : item.fullName}
                        avatarUrl={item.avatarUrl}
                        size={36}
                      />
                      <View style={styles.rowText}>
                        <Text style={styles.resultName}>
                          {item.username ? `@${item.username}` : item.fullName}
                        </Text>
                        <Text style={styles.resultMeta}>
                          {item.completedTaskCount} tamamlanan görev
                        </Text>
                      </View>
                    </View>
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
  resultsScroll: { maxHeight: 240 },
  resultRow: {
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  rowInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  rowText: { flex: 1, gap: 2 },
  resultName: { ...Typography.labelMedium, color: Colors.textPrimary },
  resultMeta: { ...Typography.caption, color: Colors.textMuted },
});
