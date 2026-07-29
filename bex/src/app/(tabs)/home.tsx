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
import { useNotifications } from '@/hooks/useNotifications';
import { useOpenNotifications } from '@/hooks/useOpenNotifications';
import { applicationsRepository, tasksRepository, EnrichedTask } from '@/features/data';
import { authService } from '@/features/auth/authService';
import { BexUser, Application } from '@/types';
import { shouldUseDemoData } from '@/lib/devMode';
import { demoStore } from '@/lib/demoStore';
import { getGreeting } from '@/lib/taskUtils';
import { resolveLocationFilter } from '@/lib/resolveLocationFilter';
import {
  formatFilterLocationLabel,
  toApiCityFilter,
} from '@/lib/locationFilterUtils';
import { APPLICATION_STATUS_LABELS } from '@/constants/taskLabels';
import { getApplicationTarget } from '@/lib/applicationNavigation';
import { useMessagingInbox } from '@/hooks/useMessagingInbox';
import { AppHeader } from '@/components/navigation/AppHeader';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { HomeScreenSkeleton } from '@/components/common/HomeScreenSkeleton';
import { TaskCard } from '@/components/tasks';
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
    route: '/(tabs)/messages' as Href,
    label: 'Sohbet',
    hint: 'İşletmelerle yazış',
    glyph: 'S',
    tint: Colors.info,
    bg: Colors.infoLight,
  },
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
    tint: Colors.primary,
    bg: Colors.primaryLight,
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
  const { unreadCount } = useNotifications();
  const { totalUnread: messageUnread, isUnlocked: messagingUnlocked } = useMessagingInbox('user');
  const openNotifications = useOpenNotifications();
  const [activeApplicationCount, setActiveApplicationCount] = useState(0);
  const [activeApplications, setActiveApplications] = useState<
    Array<Application & { taskTitle: string }>
  >([]);
  const [nearbyTasks, setNearbyTasks] = useState<EnrichedTask[]>([]);
  const [nearbySectionTitle, setNearbySectionTitle] = useState('Öne çıkan görevler');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNearbyTasks = useCallback(async (user: BexUser | null) => {
    const resolved = await resolveLocationFilter(user);

    if (toApiCityFilter(resolved.city)) {
      setNearbySectionTitle(
        `Bölgedeki görevler · ${formatFilterLocationLabel(resolved.city, resolved.district)}`
      );
      const { tasks } = await tasksRepository.getActive(4, null, {
        city: resolved.city,
        district: resolved.district,
      });
      setNearbyTasks(tasks);
      return;
    }

    setNearbySectionTitle('Öne çıkan görevler');
    const featured = await tasksRepository.getFeatured(4);
    setNearbyTasks(featured);
  }, []);

  const loadData = useCallback(async () => {
    try {
      if (firebaseUser) {
        if (shouldUseDemoData()) {
          demoStore.ensureSampleApplicationsForUser(firebaseUser.uid);
        }
        try {
          const apps = await applicationsRepository.getActiveByUser(firebaseUser.uid);
          setActiveApplicationCount(apps.length);
          const preview = await Promise.all(
            apps.slice(0, 3).map(async (app) => {
              const task = await tasksRepository.getById(app.taskId);
              return { ...app, taskTitle: task?.title ?? 'Görev' };
            })
          );
          setActiveApplications(preview);
        } catch {
          setActiveApplicationCount(0);
          setActiveApplications([]);
        }
      } else {
        setActiveApplicationCount(0);
        setActiveApplications([]);
      }

      await loadNearbyTasks(bexUser);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [firebaseUser, bexUser, loadNearbyTasks]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      authService.refreshProfile().then((fresh) => {
        if (fresh) {
          setBexUser(fresh);
          loadNearbyTasks(fresh);
        }
      });
    }, [loadData, loadNearbyTasks, setBexUser])
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
          colors={[Colors.secondary, Colors.gradientMid, '#000000']}
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

        {messageUnread > 0 ? (
          <TouchableOpacity
            style={styles.messageCard}
            activeOpacity={0.88}
            onPress={() => router.push('/(tabs)/messages' as Href)}
          >
            <Text style={styles.messageTitle}>
              {messageUnread} okunmamış mesaj
            </Text>
            <Text style={styles.messageHint}>Sohbet sekmesine git →</Text>
          </TouchableOpacity>
        ) : messagingUnlocked ? (
          <TouchableOpacity
            style={styles.messageCardMuted}
            activeOpacity={0.88}
            onPress={() => router.push('/(tabs)/messages' as Href)}
          >
            <Text style={styles.messageTitleMuted}>Sohbetlerin hazır</Text>
            <Text style={styles.messageHintMuted}>İşletmelerle yazış →</Text>
          </TouchableOpacity>
        ) : null}

        {unreadCount > 0 ? (
          <TouchableOpacity
            style={styles.noticeCard}
            activeOpacity={0.88}
            onPress={openNotifications}
          >
            <Text style={styles.noticeTitle}>
              {unreadCount} okunmamış bildirim
            </Text>
            <Text style={styles.noticeHint}>Görmek için dokun →</Text>
          </TouchableOpacity>
        ) : null}

        {activeApplicationCount > 0 ? (
          <View style={styles.summaryCard}>
            <TouchableOpacity
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
              <Text style={styles.summaryHint}>Tüm başvurular →</Text>
            </TouchableOpacity>
            {activeApplications.length > 0 ? (
              <View style={styles.appPreviewList}>
                {activeApplications.map((app) => (
                  <TouchableOpacity
                    key={app.id}
                    style={styles.appPreviewRow}
                    activeOpacity={0.88}
                    onPress={() => router.push(getApplicationTarget(app))}
                  >
                    <View style={styles.appPreviewMeta}>
                      <Text style={styles.appPreviewTitle} numberOfLines={1}>
                        {app.taskTitle}
                      </Text>
                      <Text style={styles.appPreviewStatus}>
                        {APPLICATION_STATUS_LABELS[app.status]}
                      </Text>
                    </View>
                    <Text style={styles.appPreviewArrow}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
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

        {nearbyTasks.length > 0 ? (
          <View style={styles.nearbySection}>
            <View style={styles.nearbyHeader}>
              <Text style={styles.sectionTitle}>{nearbySectionTitle}</Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/tasks' as Href)}
                activeOpacity={0.85}
              >
                <Text style={styles.seeAll}>Tümünü gör</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.nearbyList}>
              {nearbyTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  businessName={task.businessName}
                  businessVerified={task.businessVerified}
                  businessIsDangerous={task.businessIsDangerous}
                  compact
                  onPress={() => router.push(`/task/${task.id}`)}
                />
              ))}
            </View>
          </View>
        ) : null}

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
  safe: { flex: 1, backgroundColor: Colors.background },
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
  noticeCard: {
    padding: Spacing[4],
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: Spacing[1],
  },
  noticeTitle: {
    ...Typography.labelLarge,
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  noticeHint: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
  },
  messageCard: {
    padding: Spacing[4],
    backgroundColor: Colors.accentLight,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.accent,
    gap: Spacing[1],
  },
  messageTitle: {
    ...Typography.labelLarge,
    color: Colors.accentDark,
    fontWeight: '700',
  },
  messageHint: {
    ...Typography.caption,
    color: Colors.accentDark,
    fontWeight: '600',
  },
  messageCardMuted: {
    padding: Spacing[4],
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing[1],
  },
  messageTitleMuted: {
    ...Typography.labelMedium,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  messageHintMuted: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  summaryCard: {
    padding: Spacing[4],
    backgroundColor: Colors.card,
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
  summaryValue: { ...Typography.headingLarge, color: Colors.primary },
  summaryHint: { ...Typography.caption, color: Colors.primary, marginTop: Spacing[1] },
  appPreviewList: {
    marginTop: Spacing[3],
    gap: Spacing[2],
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing[3],
  },
  appPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  appPreviewMeta: { flex: 1, gap: 2 },
  appPreviewTitle: { ...Typography.labelMedium, color: Colors.textPrimary },
  appPreviewStatus: { ...Typography.caption, color: Colors.textSecondary },
  appPreviewArrow: { fontSize: 22, color: Colors.textMuted, fontWeight: '300' },
  welcomeCard: {
    padding: Spacing[4],
    backgroundColor: Colors.card,
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
  welcomeBtnText: { ...Typography.labelLarge, color: Colors.textOnPrimary, fontWeight: '700' },
  nearbySection: { gap: Spacing[3] },
  nearbyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing[2],
  },
  seeAll: { ...Typography.labelMedium, color: Colors.primary, fontWeight: '700' },
  nearbyList: { gap: Spacing[3] },
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
    backgroundColor: Colors.card,
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
