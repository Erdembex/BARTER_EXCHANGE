import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { ThemeProvider } from '@shopify/restyle';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { authService } from '@/features/auth/authService';
import { useAuthStore } from '@/store/authStore';
import { Colors, theme } from '@/theme';
import { loadDevProfiles } from '@/lib/devProfileStore';
import { initAppCheck } from '@/lib/appCheck';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { ToastProvider } from '@/components/common/Toast';
import { useNotifications } from '@/hooks/useNotifications';

export default function RootLayout() {
  const { setFirebaseUser, setBexUser, setInitialized, isInitialized } =
    useAuthStore();

  useNotifications();

  useEffect(() => {
    loadDevProfiles();
    initAppCheck();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        try {
          const bexUser = await authService.getUserDocument(firebaseUser.uid, {
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
          });
          setBexUser(bexUser);
        } catch {
          setBexUser(null);
        }
      } else {
        setBexUser(null);
      }

      setInitialized(true);
    });

    return unsubscribe;
  }, []);

  if (!isInitialized) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <SafeAreaProvider>
        <ToastProvider>
          <StatusBar style="dark" backgroundColor={Colors.background} />
          <OfflineBanner />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(business)" />
          <Stack.Screen name="(admin)" />
          <Stack.Screen name="task" />
            <Stack.Screen name="business" />
            <Stack.Screen name="application" />
            <Stack.Screen name="notifications/index" />
            <Stack.Screen name="setup-guide" />
            <Stack.Screen name="settings" />
          </Stack>
        </ToastProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
