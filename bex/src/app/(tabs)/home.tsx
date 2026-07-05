import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { router, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { applicationsRepository } from '@/features/data';
import { shouldUseDemoData } from '@/lib/devMode';
import { demoStore } from '@/lib/demoStore';
import { getGreeting } from '@/lib/taskUtils';
import { AppHeader } from '@/components/navigation/AppHeader';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { HomeScreenSkeleton } from '@/components/common/HomeScreenSkeleton';
import { Colors, Typography, Spacing, Radius } from '@/theme';

const QUICK_LINKS: { route: Href; label: string; hint: string; icon: string }[] = [
  { route: '/(tabs)/tasks' as Href, label: 'Görevler', hint: 'Tüm görevleri keşfet', icon: '◎' },
  {
    route: '/(tabs)/applications' as Href,
    label: 'Başvurular',
    hint: 'Aktif süreçlerin',
    icon: '☰',
  },
  { route: '/(tabs)/trade' as Href, label: 'Takas', hint: 'Kupon takası yap', icon: '⇄' },
  { route: '/(tabs)/wallet' as Href, label: 'Cüzdan', hint: 'Kuponlarını gör', icon: '▣' },
];

export default function HomeScreen() {
  const { bexUser, firebaseUser } = useAuthStore();
  const [activeApplicationCount, setActiveApplicationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      if (firebaseUser) {
        if (shouldUseDemoData()) {
          demoStore.ensureSampleApplicationsForUser(firebaseUser.uid);
        }
        try {
          const apps = await applicationsRepository.getActiveByUser(firebaseUser.uid);
          setActiveApplicationCount(apps.length);
        } catch {
          setActiveApplicationCount(0);
        }
      } else {
        setActiveApplicationCount(0);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [firebaseUser]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return <HomeScreenSkeleton />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="Ana Sayfa" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.hero}>
          <ProfileAvatar
            name={bexUser?.displayName}
            avatarUrl={bexUser?.avatarUrl}
            size={56}
            onPress={() => router.push('/(tabs)/profile' as Href)}
          />
          <View style={styles.heroText}>
            <Text style={styles.greeting}>{getGreeting(bexUser?.displayName)}</Text>
            <Text style={styles.subGreeting}>Menüden istediğin bölüme geçebilirsin.</Text>
          </View>
        </View>

        {activeApplicationCount > 0 ? (
          <TouchableOpacity
            style={styles.summaryCard}
            activeOpacity={0.88}
            onPress={() => router.push('/(tabs)/applications' as Href)}
          >
            <Text style={styles.summaryLabel}>Aktif başvuru</Text>
            <Text style={styles.summaryValue}>{activeApplicationCount}</Text>
            <Text style={styles.summaryHint}>Detaylar için dokun →</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.links}>
          {QUICK_LINKS.map((link) => (
            <TouchableOpacity
              key={link.label}
              style={styles.linkCard}
              activeOpacity={0.88}
              onPress={() => router.push(link.route)}
            >
              <Text style={styles.linkIcon}>{link.icon}</Text>
              <View style={styles.linkText}>
                <Text style={styles.linkLabel}>{link.label}</Text>
                <Text style={styles.linkHint}>{link.hint}</Text>
              </View>
              <Text style={styles.linkArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: {
    padding: Spacing[5],
    paddingTop: Spacing[2],
    paddingBottom: Spacing[10],
    gap: Spacing[5],
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    padding: Spacing[4],
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroText: { flex: 1, gap: Spacing[1] },
  greeting: { ...Typography.headingMedium, color: Colors.textPrimary },
  subGreeting: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
  summaryCard: {
    padding: Spacing[4],
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 2,
  },
  summaryLabel: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  summaryValue: { ...Typography.headingLarge, color: Colors.primaryDark },
  summaryHint: { ...Typography.caption, color: Colors.primary, marginTop: Spacing[1] },
  links: { gap: Spacing[3] },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[4],
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  linkIcon: {
    width: 36,
    height: 36,
    lineHeight: 36,
    textAlign: 'center',
    fontSize: 18,
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.sm,
    overflow: 'hidden',
  },
  linkText: { flex: 1, gap: 2 },
  linkLabel: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '700' },
  linkHint: { ...Typography.caption, color: Colors.textSecondary },
  linkArrow: { ...Typography.labelLarge, color: Colors.textMuted },
});
