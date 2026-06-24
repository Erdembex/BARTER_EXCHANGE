import { Stack } from 'expo-router';
import { Colors } from '@/theme';

export default function TaskLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    />
  );
}
