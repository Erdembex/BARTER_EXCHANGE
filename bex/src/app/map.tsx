import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { tasksRepository, EnrichedTask } from '@/features/data';
import { SearchBar } from '@/components/tasks/SearchBar';
import { TaskCard } from '@/components/tasks';
import { DiscoverMapView } from '@/components/map/DiscoverMapView';
import type { MapPin } from '@/components/map/types';
import { coordsForCity } from '@/lib/turkeyMapCoords';
import { Typography, Spacing, Radius, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

export default function MapScreen() {
  const { t } = useTranslation();
  const Colors = useThemeColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const [mode, setMode] = useState<'map' | 'list'>(isNative ? 'map' : 'list');
  const [search, setSearch] = useState('');
  const [tasks, setTasks] = useState<EnrichedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MapPin | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { tasks: fetched } = await tasksRepository.getActive(50, null, {
        q: search.trim() || undefined,
      });
      setTasks(fetched);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [load]);

  const pins = useMemo(() => {
    const result: MapPin[] = [];
    const seen = new Set<string>();
    for (const task of tasks) {
      const label = task.locationLabel ?? '';
      const city = label.includes(',') ? label.split(',').pop()?.trim() : label.trim();
      const coords = coordsForCity(city);
      if (!coords) continue;
      const key = `${task.businessId ?? task.id}-${city}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({
        id: key,
        task,
        latitude: coords.latitude + (Math.random() - 0.5) * 0.08,
        longitude: coords.longitude + (Math.random() - 0.5) * 0.08,
      });
    }
    return result;
  }, [tasks]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('map.title')}</Text>
        {isNative ? (
          <View style={styles.modeRow}>
            {(['map', 'list'] as const).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
                onPress={() => setMode(m)}
              >
                <Text style={[styles.modeText, mode === m && styles.modeTextActive]}>
                  {m === 'map' ? t('map.mapView') : t('map.listView')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={t('map.searchPlaceholder')}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing[6] }} />
      ) : mode === 'map' && isNative ? (
        <View style={styles.mapWrap}>
          <DiscoverMapView pins={pins} onSelectPin={setSelected} />
          {selected ? (
            <View style={styles.selectedCard}>
              <TaskCard
                task={selected.task}
                onPress={() => router.push(`/task/${selected.task.id}`)}
              />
              <TouchableOpacity onPress={() => setSelected(null)} style={styles.closeSelected}>
                <Text style={styles.closeSelectedText}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {!pins.length ? (
            <View style={styles.emptyOverlay}>
              <Text style={styles.empty}>{t('map.noResults')}</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>{t('map.noResults')}</Text>}
          renderItem={({ item }) => (
            <TaskCard task={item} onPress={() => router.push(`/task/${item.id}`)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function createStyles(Colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.background },
    header: {
      paddingHorizontal: Spacing[4],
      paddingTop: Spacing[3],
      gap: Spacing[3],
    },
    back: { ...Typography.labelMedium, color: Colors.primary },
    title: { ...Typography.headingLarge, color: Colors.textPrimary },
    modeRow: {
      flexDirection: 'row',
      gap: Spacing[2],
    },
    modeBtn: {
      paddingHorizontal: Spacing[3],
      paddingVertical: Spacing[2],
      borderRadius: Radius.md,
      backgroundColor: Colors.surfaceSecondary,
    },
    modeBtnActive: { backgroundColor: Colors.primaryLight },
    modeText: { ...Typography.labelMedium, color: Colors.textMuted },
    modeTextActive: { color: Colors.primary },
    mapWrap: { flex: 1, marginTop: Spacing[2] },
    selectedCard: {
      position: 'absolute',
      bottom: Spacing[4],
      left: Spacing[4],
      right: Spacing[4],
      backgroundColor: Colors.card,
      borderRadius: Radius.lg,
      padding: Spacing[3],
      borderWidth: 1,
      borderColor: Colors.borderLight,
    },
    closeSelected: { alignSelf: 'flex-end', marginTop: Spacing[2] },
    closeSelectedText: { ...Typography.labelMedium, color: Colors.primary },
    emptyOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
    },
    empty: {
      ...Typography.bodyMedium,
      color: Colors.textMuted,
      textAlign: 'center',
      padding: Spacing[6],
    },
    list: { padding: Spacing[4], gap: Spacing[3] },
  });
}
