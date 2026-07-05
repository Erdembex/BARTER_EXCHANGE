import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { Colors, Typography, Spacing, Radius } from '@/theme';

interface AppDrawerContentProps extends DrawerContentComponentProps {
  unreadCount?: number;
}

const MENU_ITEMS: {
  route: string;
  label: string;
  icon: string;
}[] = [
  { route: 'home', label: 'Ana Sayfa', icon: '⌂' },
  { route: 'tasks/index', label: 'Görevler', icon: '◎' },
  { route: 'applications/index', label: 'Başvurular', icon: '☰' },
  { route: 'trade', label: 'Takas', icon: '⇄' },
  { route: 'wallet', label: 'Cüzdan', icon: '▣' },
  { route: 'notifications/index', label: 'Bildirimler', icon: '◉' },
  { route: 'profile', label: 'Profil', icon: '○' },
];

export function AppDrawerContent({ state, navigation, unreadCount = 0 }: AppDrawerContentProps) {
  const insets = useSafeAreaInsets();
  const { bexUser } = useAuthStore();
  const activeRoute = state.routes[state.index]?.name;

  return (
    <View style={[styles.root, { paddingTop: insets.top + Spacing[2] }]}>
      <DrawerContentScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.profileBlock}
          activeOpacity={0.85}
          onPress={() => {
            navigation.navigate('profile');
            navigation.closeDrawer();
          }}
        >
          <ProfileAvatar
            name={bexUser?.displayName}
            avatarUrl={bexUser?.avatarUrl}
            size={52}
          />
          <View style={styles.profileText}>
            <Text style={styles.profileName} numberOfLines={1}>
              {bexUser?.displayName ?? 'Kullanıcı'}
            </Text>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {bexUser?.email ?? '—'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        {MENU_ITEMS.map((item) => {
          const active = activeRoute === item.route;
          const badge = item.route === 'notifications/index' && unreadCount > 0;

          return (
            <TouchableOpacity
              key={item.route}
              style={[styles.menuItem, active && styles.menuItemActive]}
              activeOpacity={0.85}
              onPress={() => {
                navigation.navigate(item.route);
                navigation.closeDrawer();
              }}
            >
              <Text style={[styles.menuIcon, active && styles.menuIconActive]}>{item.icon}</Text>
              <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>{item.label}</Text>
              {badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </DrawerContentScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing[3] }]}>
        <Text style={styles.footerText}>BEX · Beceri Takas Platformu</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scroll: {
    paddingHorizontal: Spacing[4],
    paddingBottom: Spacing[4],
  },
  profileBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[3],
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
    marginBottom: Spacing[3],
  },
  profileText: { flex: 1, gap: 2 },
  profileName: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '700' },
  profileEmail: { ...Typography.caption, color: Colors.textSecondary },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: Spacing[3],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3],
    borderRadius: Radius.sm,
    marginBottom: Spacing[1],
  },
  menuItemActive: {
    backgroundColor: Colors.primaryLight,
  },
  menuIcon: {
    width: 24,
    textAlign: 'center',
    fontSize: 16,
    color: Colors.textMuted,
  },
  menuIconActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  menuLabel: {
    ...Typography.labelMedium,
    color: Colors.textSecondary,
    flex: 1,
  },
  menuLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '700',
    fontSize: 11,
  },
  footer: {
    paddingHorizontal: Spacing[4],
    paddingTop: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});
