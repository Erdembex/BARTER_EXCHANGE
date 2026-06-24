import { Tabs, Redirect } from 'expo-router';
import { Text } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/theme';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
  );
}

export default function BusinessTabsLayout() {
  const { bexUser } = useAuthStore();

  if (bexUser && bexUser.role !== 'business') {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <Tabs
      initialRouteName="panel"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="panel"
        options={{
          title: 'Panel',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
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
        name="applications/index"
        options={{
          title: 'Başvurular',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📥" focused={focused} />,
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
        name="analytics"
        options={{
          title: 'Analitik',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📈" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="create-task"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="applications/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
