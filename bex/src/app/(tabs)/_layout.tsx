import { Tabs, Redirect } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/authStore';
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

export default function UserTabsLayout() {
  const { bexUser } = useAuthStore();
  const { totalUnread, isUnlocked } = useMessagingInbox('user');

  if (bexUser?.role === 'business') {
    return <Redirect href="/(business)/panel" />;
  }

  return (
    <Tabs
      initialRouteName="home"
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
          fontSize: 11,
          fontWeight: '600',
          marginTop: -2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⌂" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="tasks/index"
        options={{
          title: 'Görevler',
          tabBarIcon: ({ focused }) => <TabIcon emoji="◎" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Sohbet',
          tabBarBadge: totalUnread > 0 ? (totalUnread > 99 ? '99+' : totalUnread) : undefined,
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="💬" focused={focused} locked={!isUnlocked} />
          ),
        }}
      />
      <Tabs.Screen
        name="applications/index"
        options={{
          title: 'Başvurular',
          tabBarIcon: ({ focused }) => <TabIcon emoji="☰" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ focused }) => <TabIcon emoji="○" focused={focused} />,
        }}
      />
      <Tabs.Screen name="trade" options={{ href: null }} />
      <Tabs.Screen name="wallet" options={{ href: null }} />
      <Tabs.Screen name="notifications/index" options={{ href: null }} />
      <Tabs.Screen name="complaints/index" options={{ href: null }} />
      <Tabs.Screen name="more" options={{ href: null }} />
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
