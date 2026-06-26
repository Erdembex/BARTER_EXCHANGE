import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/theme';

export default function Index() {
  const { firebaseUser, bexUser, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!firebaseUser) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  // Profil henüz yükleniyor (kayıt/giriş sonrası)
  if (!bexUser) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (bexUser.isBanned) {
    return <Redirect href="/(auth)/banned" />;
  }

  if (bexUser.role === 'business') {
    return <Redirect href="/(business)/panel" />;
  }

  if (bexUser.role === 'admin') {
    return <Redirect href="/(admin)/panel" />;
  }

  return <Redirect href="/(tabs)/home" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
