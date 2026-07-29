import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { router, Href } from 'expo-router';
import { AppHeader } from '@/components/navigation/AppHeader';
import { useOpenNotifications } from '@/hooks/useOpenNotifications';
import { useNotifications } from '@/hooks/useNotifications';
import { Colors, Typography, Spacing, Radius } from '@/theme';

type MoreLink = {
  route: Href;
  label: string;
  hint: string;
  icon: string;
};

const MORE_LINKS: MoreLink[] = [
  { route: '/(tabs)/trade' as Href, label: 'Takas', hint: 'Kupon takası yap', icon: '⇄' },
  { route: '/(tabs)/wallet' as Href, label: 'Cüzdan', hint: 'Kuponlarını gör', icon: '▣' },
  {
    route: '/(tabs)/complaints/index' as Href,
    label: 'Şikayet BEX',
    hint: 'Şikayet bildir',
    icon: '⚠',
  },
];

export default function MoreScreen() {
  const openNotifications = useOpenNotifications();
  const { unreadCount } = useNotifications();

  return (
    <SafeAreaView style={styles.safe}>
      <AppHeader title="Menü" showMenu={false} showNotifications={false} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.noticeCard} activeOpacity={0.88} onPress={openNotifications}>
          <View style={styles.noticeLeft}>
            <Text style={styles.noticeIcon}>◉</Text>
            <View>
              <Text style={styles.noticeTitle}>Bildirimler</Text>
              <Text style={styles.noticeHint}>Başvuru, mesaj ve kupon güncellemeleri</Text>
            </View>
          </View>
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          ) : (
            <Text style={styles.chevron}>›</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.section}>Diğer</Text>
        {MORE_LINKS.map((link) => (
          <TouchableOpacity
            key={link.label}
            style={styles.linkRow}
            activeOpacity={0.88}
            onPress={() => router.push(link.route)}
          >
            <Text style={styles.linkIcon}>{link.icon}</Text>
            <View style={styles.linkBody}>
              <Text style={styles.linkTitle}>{link.label}</Text>
              <Text style={styles.linkHint}>{link.hint}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing[5], gap: Spacing[3], paddingBottom: Spacing[10] },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noticeLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], flex: 1 },
  noticeIcon: { fontSize: 22, color: Colors.primary, fontWeight: '700' },
  noticeTitle: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '700' },
  noticeHint: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { ...Typography.caption, color: Colors.textInverse, fontWeight: '800', fontSize: 11 },
  section: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: Spacing[2],
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  linkIcon: { width: 28, textAlign: 'center', fontSize: 18, color: Colors.primary },
  linkBody: { flex: 1, gap: 2 },
  linkTitle: { ...Typography.labelLarge, color: Colors.textPrimary },
  linkHint: { ...Typography.caption, color: Colors.textSecondary },
  chevron: { ...Typography.headingMedium, color: Colors.textMuted, fontWeight: '300' },
});
