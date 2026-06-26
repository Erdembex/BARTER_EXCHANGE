import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function AdminLayout() {
  const { bexUser } = useAuthStore();

  if (bexUser && bexUser.role !== 'admin') {
    return <Redirect href="/" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="panel" />
      <Stack.Screen name="tasks" />
      <Stack.Screen name="verifications" />
      <Stack.Screen name="submissions" />
      <Stack.Screen name="users" />
    </Stack>
  );
}
