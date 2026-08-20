import React, { useCallback, useMemo, useRef, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { router, Href } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { useNotifications } from '@/hooks/useNotifications';
import { useOpenNotifications } from '@/hooks/useOpenNotifications';
import { applicationsRepository, tasksRepository, businessesRepository, EnrichedTask } from '@/features/data';
import { authService } from '@/features/auth/authService';
import { BexUser, Application, Business } from '@/types';
import { shouldUseDemoData } from '@/lib/devMode';
import { demoStore } from '@/lib/demoStore';
import { getGreeting } from '@/lib/taskUtils';
import { resolveLocationFilter } from '@/lib/resolveLocationFilter';
import {
  formatFilterLocationLabel,
  toApiCityFilter,
} from '@/lib/locationFilterUtils';
import { useApplicationStatusLabels } from '@/constants/taskLabels';
import { getApplicationTarget } from '@/lib/applicationNavigation';
import { useMessagingInbox } from '@/hooks/useMessagingInbox';
import { AppHeader } from '@/components/navigation/AppHeader';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { HomeScreenSkeleton } from '@/components/common/HomeScreenSkeleton';
import { TaskCard } from '@/components/tasks';
import { SearchBar } from '@/components/tasks/SearchBar';
import { Typography, Spacing, Radius, Shadow, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

type QuickLink = {
  route: Href;
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  bg: string;
};

function getQuickLinks(
  Colors: ReturnType<typeof useThemeColors>,
  t: (key: string) => string
): QuickLink[] {
  return [
    {
      route: '/(tabs)/messages' as Href,
      label: t('home.quickLinks.messages.label'),
      hint: t('home.quickLinks.messages.hint'),
      icon: 'chatbubble-ellipses',
      tint: Colors.info,
      bg: Colors.infoLight,
    },
    {
      route: '/(tabs)/tasks' as Href,
      label: t('home.quickLinks.tasks.label'),
      hint: t('home.quickLinks.tasks.hint'),
      icon: 'briefcase',
      tint: Colors.primary,
      bg: Colors.primaryLight,
    },
    {
      route: '/(tabs)/applications' as Href,
      label: t('home.quickLinks.applications.label'),
      hint: t('home.quickLinks.applications.hint'),
      icon: 'document-text',
      tint: Colors.primary,
      bg: Colors.primaryLight,
    },
    {
      route: '/(tabs)/trade' as Href,
      label: t('home.quickLinks.trade.label'),
      hint: t('home.quickLinks.trade.hint'),
      icon: 'swap-horizontal',
      tint: Colors.accentDark,
      bg: Colors.accentLight,
    },
    {
      route: '/(tabs)/wallet' as Href,
      label: t('home.quickLinks.wallet.label'),
      hint: t('home.quickLinks.wallet.hint'),
      icon: 'wallet',
      tint: Colors.success,
      bg: Colors.successLight,
    },
  ];
}

function getDiscoverLinks(
  Colors: ReturnType<typeof useThemeColors>,
  t: (key: string) => string
): QuickLink[] {
  return [
    {
      route: '/map' as Href,
      label: t('home.discoverLinks.map.label'),
      hint: t('home.discoverLinks.map.hint'),
      icon: 'map',
      tint: Colors.accent,
      bg: Colors.accentLight,
    },
    {
      route: '/leaderboard' as Href,
      label: t('home.discoverLinks.leaderboard.label'),
      hint: t('home.discoverLinks.leaderboard.hint'),
      icon: 'trophy',
      tint: Colors.primary,
      bg: Colors.primaryLight,
    },
    {
      route: '/about' as Href,
      label: t('home.discoverLinks.about.label'),
      hint: t('home.discoverLinks.about.hint'),
      icon: 'heart',
      tint: Colors.secondary,
      bg: Colors.businessLight,
    },
  ];
}

export default function HomeScreen() {
  const { bexUser, firebaseUser, setBexUser } = useAuthStore();
  const Colors = useThemeColors();
  const { t } = useTranslation();
  const applicationStatusLabels = useApplicationStatusLabels();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const QUICK_LINKS = useMemo(() => getQuickLinks(Colors, t), [Colors, t]);
  const DISCOVER_LINKS = useMemo(() => getDiscoverLinks(Colors, t), [Colors, t]);
  const { unreadCount } = useNotifications();
  const { totalUnread: messageUnread, isUnlocked: messagingUnlocked } = useMessagingInbox('user');
  const openNotifications = useOpenNotifications();
  const [activeApplicationCount, setActiveApplicationCount] = useState(0);
  const [activeApplications, setActiveApplications] = useState<
    Array<Application & { taskTitle: string }>
  >([]);
  const [nearbyTasks, setNearbyTasks] = useState<EnrichedTask[]>([]);
  const [popularBusinesses, setPopularBusinesses] = useState<Business[]>([]);
  const [nearbySectionTitle, setNearbySectionTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [homeSearch, setHomeSearch] = useState('');
  const loadSeqRef = useRef(0);

  const loadNearbyTasks = useCallback(async (user: BexUser | null) => {
    const seq = ++loadSeqRef.current;
    const resolved = await resolveLocationFilter(user);
    const cityFilter = toApiCityFilter(resolved.city);
    const regionalLabel = formatFilterLocationLabel(resolved.city, resolved.district);

    let title = t('home.featuredTasks');
    let tasks: EnrichedTask[] = [];

    if (cityFilter) {
      const { tasks: regional } = await tasksRepository.getActive(4, null, {
        city: resolved.city ?? undefined,
        district: resolved.district ?? undefined,
      });
      if (seq !== loadSeqRef.current) return;

      if (regional.length > 0) {
        title = t('home.regionalTasks', { location: regionalLabel });
        tasks = regional;
      } else {
        tasks = await tasksRepository.getFeatured(4);
        if (seq !== loadSeqRef.current) return;
      }
    } else {
      tasks = await tasksRepository.getFeatured(4);
      if (seq !== loadSeqRef.current) return;
    }

    setNearbySectionTitle(title);
    setNearbyTasks(tasks);
  }, [t]);

  const loadData = useCallback(async (user: BexUser | null) => {
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
              return { ...app, taskTitle: task?.title ?? t('common.task') };
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

      await loadNearbyTasks(user);
      const popular = await businessesRepository.getPopular(6);
      setPopularBusinesses(popular);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [firebaseUser, loadNearbyTasks, t]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      (async () => {
        const fresh = await authService.refreshProfile().catch(() => null);
        if (!active) return;

        const user = fresh ?? bexUser;
        if (fresh) setBexUser(fresh);
        await loadData(user);
      })();

      return () => {
        active = false;
        loadSeqRef.current += 1;
      };
    }, [bexUser, loadData, setBexUser])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData(bexUser);
  };

  const openTaskSearch = () => {
    const query = homeSearch.trim();
    if (query) {
      router.push({ pathname: '/search', params: { q: query } } as Href);
      return;
    }
    router.push('/search' as Href);
  };

  if (loading) {
    return <HomeScreenSkeleton />;
  }

  const displayName = bexUser?.displayName?.trim() || t('common.user');

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title={t('home.title')} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        contentContainerStyle={styles.scroll}
      >
        <LinearGradient
          colors={[Colors.gradientBlue, Colors.gradientMid, Colors.secondary]}
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
            <Text style={styles.greeting}>{getGreeting(displayName, t)}</Text>
            <Text style={styles.subGreeting}>{t('home.subGreeting')}</Text>
          </View>
        </LinearGradient>

        <View style={styles.searchWrap}>
          <SearchBar
            value={homeSearch}
            onChangeText={setHomeSearch}
            placeholder={t('home.searchPlaceholder')}
            onSubmit={openTaskSearch}
          />
          <TouchableOpacity style={styles.searchBtn} activeOpacity={0.88} onPress={openTaskSearch}>
            <Text style={styles.searchBtnText}>{t('common.search')}</Text>
          </TouchableOpacity>
        </View>

        {messageUnread > 0 ? (
          <TouchableOpacity
            style={styles.messageCard}
            activeOpacity={0.88}
            onPress={() => router.push('/(tabs)/messages' as Href)}
          >
            <Text style={styles.messageTitle}>
              {t('home.unreadMessages', { count: messageUnread })}
            </Text>
            <Text style={styles.messageHint}>{t('home.goToMessages')}</Text>
          </TouchableOpacity>
        ) : messagingUnlocked ? (
          <TouchableOpacity
            style={styles.messageCardMuted}
            activeOpacity={0.88}
            onPress={() => router.push('/(tabs)/messages' as Href)}
          >
            <Text style={styles.messageTitleMuted}>{t('home.messagesReady')}</Text>
            <Text style={styles.messageHintMuted}>{t('home.chatWithBusinesses')}</Text>
          </TouchableOpacity>
        ) : null}

        {unreadCount > 0 ? (
          <TouchableOpacity
            style={styles.noticeCard}
            activeOpacity={0.88}
            onPress={openNotifications}
          >
            <Text style={styles.noticeTitle}>
              {t('home.unreadNotifications', { count: unreadCount })}
            </Text>
            <Text style={styles.noticeHint}>{t('home.tapToView')}</Text>
          </TouchableOpacity>
        ) : null}

        {activeApplicationCount > 0 ? (
          <View style={styles.summaryCard}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => router.push('/(tabs)/applications' as Href)}
            >
              <View style={styles.summaryTop}>
                <Text style={styles.summaryLabel}>{t('home.activeApplication')}</Text>
                <View style={styles.summaryBadge}>
                  <Text style={styles.summaryBadgeText}>{t('common.live')}</Text>
                </View>
              </View>
              <Text style={styles.summaryValue}>{activeApplicationCount}</Text>
              <Text style={styles.summaryHint}>{t('home.allApplications')}</Text>
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
                        {applicationStatusLabels[app.status]}
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
            <Text style={styles.welcomeTitle}>{t('home.welcomeTitle')}</Text>
            <Text style={styles.welcomeBody}>{t('home.welcomeBody')}</Text>
            <TouchableOpacity
              style={styles.welcomeBtn}
              onPress={() => router.push('/(tabs)/tasks' as Href)}
              activeOpacity={0.88}
            >
              <Text style={styles.welcomeBtnText}>{t('home.exploreTasks')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {popularBusinesses.length > 0 ? (
          <View style={styles.popularSection}>
            <Text style={styles.sectionTitle}>{t('home.popularBusinesses')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.popularRow}
            >
              {popularBusinesses.map((biz) => (
                <TouchableOpacity
                  key={biz.id}
                  style={styles.popularCard}
                  activeOpacity={0.88}
                  onPress={() => router.push(`/business/${biz.id}` as Href)}
                >
                  <View style={styles.popularAvatar}>
                    <Text style={styles.popularAvatarText}>{biz.name.slice(0, 1)}</Text>
                  </View>
                  <Text style={styles.popularName} numberOfLines={2}>
                    {biz.name}
                    {biz.isVerified ? ' ✓' : ''}
                  </Text>
                  {biz.completedTaskCount != null && biz.completedTaskCount > 0 ? (
                    <Text style={styles.popularMeta}>
                      {t('home.completedTasks', { count: biz.completedTaskCount })}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {nearbyTasks.length > 0 ? (
          <View style={styles.nearbySection}>
            <View style={styles.nearbyHeader}>
              <Text style={styles.sectionTitle}>{nearbySectionTitle}</Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/tasks' as Href)}
                activeOpacity={0.85}
              >
                <Text style={styles.seeAll}>{t('common.seeAll')}</Text>
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

        <Text style={styles.sectionTitle}>{t('home.discoverMore')}</Text>
        <View style={styles.links}>
          {DISCOVER_LINKS.map((link) => (
            <TouchableOpacity
              key={link.label}
              style={styles.linkCard}
              activeOpacity={0.88}
              onPress={() => router.push(link.route)}
            >
              <View style={[styles.linkIconWrap, { backgroundColor: link.bg }]}>
                <Ionicons name={link.icon} size={20} color={link.tint} />
              </View>
              <View style={styles.linkText}>
                <Text style={styles.linkLabel}>{link.label}</Text>
                <Text style={styles.linkHint}>{link.hint}</Text>
              </View>
              <Text style={styles.linkArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t('home.quickAccess')}</Text>
        <View style={styles.links}>
          {QUICK_LINKS.map((link) => (
            <TouchableOpacity
              key={link.label}
              style={styles.linkCard}
              activeOpacity={0.88}
              onPress={() => router.push(link.route)}
            >
              <View style={[styles.linkIconWrap, { backgroundColor: link.bg }]}>
                <Ionicons name={link.icon} size={20} color={link.tint} />
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

function createStyles(Colors: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  searchBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing[4],
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    ...Typography.labelMedium,
    color: Colors.textOnPrimary,
    fontWeight: '700',
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
  popularSection: { gap: Spacing[3] },
  popularRow: { gap: Spacing[3], paddingRight: Spacing[2] },
  popularCard: {
    width: 132,
    padding: Spacing[3],
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: Spacing[2],
  },
  popularAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popularAvatarText: { ...Typography.labelLarge, color: Colors.primary, fontWeight: '800' },
  popularName: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '700',
    textAlign: 'center',
    minHeight: 32,
  },
  popularMeta: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center' },
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
}
