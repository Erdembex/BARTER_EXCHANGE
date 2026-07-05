import { Redirect } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useAuthStore } from '@/store/authStore';
import { useNotifications } from '@/hooks/useNotifications';
import { AppDrawerContent } from '@/components/navigation/AppDrawerContent';
import { Colors } from '@/theme';

export default function DrawerLayout() {
  const { bexUser } = useAuthStore();
  const { unreadCount } = useNotifications();

  if (bexUser?.role === 'business') {
    return <Redirect href="/(business)/panel" />;
  }

  return (
    <Drawer
      drawerContent={(props: DrawerContentComponentProps) => (
        <AppDrawerContent {...props} unreadCount={unreadCount} />
      )}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerPosition: 'left',
        swipeEnabled: true,
        overlayColor: 'rgba(0,0,0,0.35)',
        drawerStyle: {
          width: 280,
          backgroundColor: Colors.white,
        },
      }}
    >
      <Drawer.Screen name="home" options={{ drawerLabel: 'Ana Sayfa', title: 'Ana Sayfa' }} />
      <Drawer.Screen
        name="tasks/index"
        options={{ drawerLabel: 'Görevler', title: 'Görevler' }}
      />
      <Drawer.Screen
        name="applications/index"
        options={{ drawerLabel: 'Başvurular', title: 'Başvurular' }}
      />
      <Drawer.Screen name="trade" options={{ drawerLabel: 'Takas', title: 'Takas' }} />
      <Drawer.Screen name="wallet" options={{ drawerLabel: 'Cüzdan', title: 'Cüzdan' }} />
      <Drawer.Screen
        name="notifications/index"
        options={{ drawerLabel: 'Bildirimler', title: 'Bildirimler' }}
      />
      <Drawer.Screen name="profile" options={{ drawerLabel: 'Profil', title: 'Profil' }} />
    </Drawer>
  );
}
