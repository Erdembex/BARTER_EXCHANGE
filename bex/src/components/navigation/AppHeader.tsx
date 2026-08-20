import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router, Href } from 'expo-router';
import { useNotifications } from '@/hooks/useNotifications';
import { useOpenNotifications } from '@/hooks/useOpenNotifications';
import { Typography, Spacing, createThemedStyles } from '@/theme';
import { useTranslation } from '@/i18n';

interface AppHeaderProps {
  title?: string;
  showMenu?: boolean;
  showNotifications?: boolean;
  onBack?: () => void;
}

const useStyles = createThemedStyles((Colors) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[2],
    paddingBottom: Spacing[2],
    gap: Spacing[3],
    backgroundColor: Colors.background,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  iconPlaceholder: { width: 40 },
  bellIcon: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.textOnPrimary,
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 12,
  },
  titleSpacer: { flex: 1 },
  menuIcon: { gap: 4, width: 18 },
  bar: {
    height: 2,
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },
  backIcon: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: '700',
  },
  title: {
    ...Typography.headingMedium,
    color: Colors.textPrimary,
    flex: 1,
  },
}));

export function AppHeader({
  title,
  showMenu = true,
  showNotifications = true,
  onBack,
}: AppHeaderProps) {
  const styles = useStyles();
  const { unreadCount } = useNotifications();
  const openNotifications = useOpenNotifications();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      ) : showMenu ? (
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/more' as Href)}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel={t('header.openMenu')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View style={styles.menuIcon}>
            <View style={styles.bar} />
            <View style={styles.bar} />
            <View style={styles.bar} />
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.iconPlaceholder} />
      )}
      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View style={styles.titleSpacer} />
      )}
      {showNotifications && !onBack ? (
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={openNotifications}
          accessibilityRole="button"
          accessibilityLabel={t('header.notifications')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.bellIcon}>◉</Text>
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      ) : (
        <View style={styles.iconPlaceholder} />
      )}
    </View>
  );
}
