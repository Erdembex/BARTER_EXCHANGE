import { Tabs, Redirect } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useBusiness } from '@/features/business/useBusiness';
import { useMessagingInbox } from '@/hooks/useMessagingInbox';
import { Colors } from '@/theme';

function TabIcon({
  emoji,
  focused,
  locked,
}: {
  emoji: string;
  focused: boolean;
  locked?: boolean;
}) {
  return (
    <View style={styles.iconWrap}>
      <Text style={{ fontSize: 20, opacity: locked ? 0.35 : focused ? 1 : 0.45 }}>{emoji}</Text>
      {locked ? <Text style={styles.lockDot}>🔒</Text> : null}
    </View>
  );
}

export default function BusinessTabsLayout() {
  const { bexUser } = useAuthStore();
  const { business } = useBusiness();
  const { totalUnread, isUnlocked } = useMessagingInbox('business');

  if (bexUser && bexUser.role !== 'business') {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <Tabs
      initialRouteName="panel"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 4,
          height: 58,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: -2,
        },
      }}
    >
      <Tabs.Screen
        name="panel"
        options={{
          title: 'Panel',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="applications/index"
        options={{
          title: 'Başvuru',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📥" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Sohbet',
          tabBarBadge: totalUnread > 0 ? (totalUnread > 99 ? '99+' : totalUnread) : undefined,
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="💬" focused={focused} locked={!isUnlocked && !!business?.id} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Görevler',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="coupons/index"
        options={{
          title: 'Kupon',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎟️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="profile-search" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="create-task" options={{ href: null }} />
      <Tabs.Screen name="applications/[id]" options={{ href: null }} />
      <Tabs.Screen name="edit-task/[id]" options={{ href: null }} />
      <Tabs.Screen name="complaints/index" options={{ href: null }} />
      <Tabs.Screen name="verification" options={{ href: null }} />
      <Tabs.Screen name="subscription" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  lockDot: {
    position: 'absolute',
    right: -8,
    top: -4,
    fontSize: 8,
  },
});
