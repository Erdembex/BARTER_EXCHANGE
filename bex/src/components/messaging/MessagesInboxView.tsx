import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router, Href } from 'expo-router';
import { useMessagingInbox, MessagingAudience } from '@/hooks/useMessagingInbox';
import { ConversationRow } from '@/components/messaging/ConversationRow';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Button } from '@/components/ui';
import { Colors, Typography, Spacing, Radius } from '@/theme';

type MessagesInboxViewProps = {
  audience: MessagingAudience;
  chatRoute: (applicationId: string) => Href;
  showMenu?: boolean;
};

const LOCKED_COPY: Record<
  MessagingAudience,
  { title: string; text: string; primary: { label: string; route: Href }; secondary?: { label: string; route: Href } }
> = {
  user: {
    title: 'Sohbet henüz kapalı',
    text: 'Bir göreve başvurup işletme tarafından onaylandığında buradan işletme ile yazışabilirsin.',
    primary: { label: 'Görevlere Göz At', route: '/(tabs)/tasks' as Href },
    secondary: { label: 'Başvurularım', route: '/(tabs)/applications' as Href },
  },
  business: {
    title: 'Sohbet henüz kapalı',
    text: 'Onayladığın en az bir başvuru olduğunda adaylarla buradan yazışabilirsin.',
    primary: { label: 'Başvurulara Git', route: '/(business)/applications' as Href },
    secondary: { label: 'Panele Dön', route: '/(business)/panel' as Href },
  },
};

const SUBTITLE: Record<MessagingAudience, string> = {
  user: 'Onaylanmış başvuruların için işletmelerle güvenli sohbet.',
  business: 'Onayladığın başvurular için adaylarla güvenli sohbet.',
};

export function MessagesInboxView({
  audience,
  chatRoute,
  showMenu = audience === 'user',
}: MessagesInboxViewProps) {
  const { conversations, isUnlocked, loading, refresh } = useMessagingInbox(audience);
  const [refreshing, setRefreshing] = React.useState(false);
  const locked = LOCKED_COPY[audience];

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {showMenu ? (
        <AppHeader title="Sohbet" showMenu />
      ) : (
        <View style={styles.bizHeader}>
          <Text style={styles.bizTitle}>Sohbet</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : !isUnlocked ? (
        <View style={styles.lockedWrap}>
          <View style={styles.lockedCard}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.lockedTitle}>{locked.title}</Text>
            <Text style={styles.lockedText}>{locked.text}</Text>
            <Button
              title={locked.primary.label}
              onPress={() => router.push(locked.primary.route)}
              style={{ alignSelf: 'stretch', marginTop: Spacing[4] }}
            />
            {locked.secondary ? (
              <Button
                title={locked.secondary.label}
                variant="outline"
                onPress={() => router.push(locked.secondary!.route)}
                style={{ alignSelf: 'stretch' }}
              />
            ) : null}
          </View>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.applicationId}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          ListHeaderComponent={
            <Text style={styles.subtitle}>{SUBTITLE[audience]}</Text>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Henüz aktif sohbet yok.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ConversationRow
              item={item}
              onPress={() => router.push(chatRoute(item.applicationId))}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  bizHeader: {
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[3],
    paddingBottom: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  bizTitle: { ...Typography.headingMedium, color: Colors.textPrimary, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing[4],
    lineHeight: 20,
  },
  list: {
    padding: Spacing[5],
    paddingTop: Spacing[2],
    gap: Spacing[3],
    paddingBottom: Spacing[10],
  },
  lockedWrap: {
    flex: 1,
    padding: Spacing[5],
    justifyContent: 'center',
  },
  lockedCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing[6],
    alignItems: 'center',
    gap: Spacing[2],
  },
  lockIcon: { fontSize: 44, marginBottom: Spacing[2] },
  lockedTitle: { ...Typography.headingMedium, color: Colors.textPrimary, textAlign: 'center' },
  lockedText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  empty: { paddingVertical: Spacing[10], alignItems: 'center' },
  emptyText: { ...Typography.bodyMedium, color: Colors.textTertiary },
});
