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
import { LinearGradient } from 'expo-linear-gradient';
import { router, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { applicationsRepository } from '@/features/data';
import { authService } from '@/features/auth/authService';
import { shouldUseDemoData } from '@/lib/devMode';
import { demoStore } from '@/lib/demoStore';
import { getGreeting } from '@/lib/taskUtils';
import { AppHeader } from '@/components/navigation/AppHeader';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { HomeScreenSkeleton } from '@/components/common/HomeScreenSkeleton';
import { Colors, Typography, Spacing, Radius, Shadow } from '@/theme';

type QuickLink = {
  route: Href;
  label: string;
  hint: string;
  glyph: string;
  tint: string;
  bg: string;
};

const QUICK_LINKS: QuickLink[] = [
  {
    route: '/(tabs)/tasks' as Href,
    label: 'Görevler',
    hint: 'Yeni fırsatları keşfet',
    glyph: 'G',
    tint: Colors.primary,
    bg: Colors.primaryLight,
  },
  {
    route: '/(tabs)/applications' as Href,
    label: 'Başvurular',
    hint: 'Aktif süreçlerin',
    glyph: 'B',
    tint: Colors.secondary,
    bg: 'rgba(37, 99, 235, 0.08)',
  },
  {
    route: '/(tabs)/trade' as Href,
    label: 'Takas',
    hint: 'Kupon takası yap',
    glyph: 'T',
    tint: Colors.accentDark,
    bg: Colors.accentLight,
  },
  {
    route: '/(tabs)/wallet' as Href,
    label: 'Cüzdan',
    hint: 'Kuponlarını gör',
    glyph: 'C',
    tint: Colors.success,
    bg: Colors.successLight,
  },
];

export default function HomeScreen() {
  const { bexUser, firebaseUser, setBexUser } = useAuthStore();
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
      authService.refreshProfile().then((fresh) => {
        if (fresh) setBexUser(fresh);
      });
    }, [loadData, setBexUser])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return <HomeScreenSkeleton />;
  }

  const displayName = bexUser?.displayName?.trim() || 'Kullanıcı';

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
        <LinearGradient
          colors={[Colors.primary, Colors.gradientMid, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push('/(tabs)/profile' as Href)}
            style={styles.avatarRing}
          >
            <ProfileAvatar name={displayName} avatarUrl={bexUser?.avatarUrl} size={64} />
          </TouchableOpacity>
          <View style={styles.heroText}>
            <Text style={styles.greeting}>{getGreeting(displayName)}</Text>
            <Text style={styles.subGreeting}>
              Menüden istediğin bölüme geçebilir veya hızlı erişim kartlarını kullanabilirsin.
            </Text>
          </View>
        </LinearGradient>

        {activeApplicationCount > 0 ? (
          <TouchableOpacity
            style={styles.summaryCard}
            activeOpacity={0.88}
            onPress={() => router.push('/(tabs)/applications' as Href)}
          >
            <View style={styles.summaryTop}>
              <Text style={styles.summaryLabel}>Aktif başvuru</Text>
              <View style={styles.summaryBadge}>
                <Text style={styles.summaryBadgeText}>Canlı</Text>
              </View>
            </View>
            <Text style={styles.summaryValue}>{activeApplicationCount}</Text>
            <Text style={styles.summaryHint}>Detaylar için dokun</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.welcomeCard}>
            <Text style={styles.welcomeTitle}>Hoş geldin</Text>
            <Text style={styles.welcomeBody}>
              Görevlere göz at, başvuru yap ve kupon kazanmaya başla.
            </Text>
            <TouchableOpacity
              style={styles.welcomeBtn}
              onPress={() => router.push('/(tabs)/tasks' as Href)}
              activeOpacity={0.88}
            >
              <Text style={styles.welcomeBtnText}>Görevleri keşfet</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>Hızlı erişim</Text>
        <View style={styles.links}>
          {QUICK_LINKS.map((link) => (
            <TouchableOpacity
              key={link.label}
              style={styles.linkCard}
              activeOpacity={0.88}
              onPress={() => router.push(link.route)}
            >
              <View style={[styles.linkIconWrap, { backgroundColor: link.bg }]}>
                <Text style={[styles.linkGlyph, { color: link.tint }]}>{link.glyph}</Text>
              </View>
              <View style={styles.linkText}>
                <Text style={styles.linkLabel}>{link.label}</Text>
                <Text style={styles.linkHint}>{link.hint}</Text>
              </View>
              <Text style={styles.linkArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.surface },
  scroll: {
    padding: Spacing[5],
    paddingTop: Spacing[2],
    paddingBottom: Spacing[10],
    gap: Spacing[4],
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    padding: Spacing[5],
    borderRadius: Radius.xl,
    ...Shadow.primary,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  heroText: { flex: 1, gap: Spacing[2] },
  greeting: {
    ...Typography.headingMedium,
    color: Colors.textInverse,
    fontWeight: '700',
  },
  subGreeting: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.88)',
    lineHeight: 20,
  },
  summaryCard: {
    padding: Spacing[4],
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing[1],
    ...Shadow.card,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  summaryBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  summaryBadgeText: {
    ...Typography.caption,
    color: Colors.success,
    fontWeight: '700',
  },
  summaryValue: { ...Typography.headingLarge, color: Colors.primaryDark },
  summaryHint: { ...Typography.caption, color: Colors.primary, marginTop: Spacing[1] },
  welcomeCard: {
    padding: Spacing[4],
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing[2],
    ...Shadow.card,
  },
  welcomeTitle: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '700' },
  welcomeBody: { ...Typography.bodySmall, color: Colors.textSecondary, lineHeight: 20 },
  welcomeBtn: {
    alignSelf: 'flex-start',
    marginTop: Spacing[1],
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: Radius.md,
  },
  welcomeBtnText: { ...Typography.labelLarge, color: Colors.textInverse, fontWeight: '700' },
  sectionTitle: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginTop: Spacing[1],
  },
  links: { gap: Spacing[3] },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[4],
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  linkIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkGlyph: {
    fontSize: 18,
    fontWeight: '800',
  },
  linkText: { flex: 1, gap: 2 },
  linkLabel: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '700' },
  linkHint: { ...Typography.caption, color: Colors.textSecondary },
  linkArrow: {
    fontSize: 28,
    lineHeight: 28,
    color: Colors.textMuted,
    fontWeight: '300',
  },
});
