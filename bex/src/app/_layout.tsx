import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@shopify/restyle';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { authService } from '@/features/auth/authService';
import { useAuthStore } from '@/store/authStore';
import { Colors, theme } from '@/theme';
import { initAppCheck } from '@/lib/appCheck';
import { OfflineBanner } from '@/components/common/OfflineBanner';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { ToastProvider } from '@/components/common/Toast';
import { useNotifications } from '@/hooks/useNotifications';

export default function RootLayout() {
  const { setFirebaseUser, setBexUser, setInitialized, isInitialized } =
    useAuthStore();

  useNotifications();

  useEffect(() => {
    initAppCheck();
  }, []);

  useEffect(() => {
    let cancelled = false;

    authService.restoreSession().then(({ session, bexUser }) => {
      if (cancelled) return;
      setFirebaseUser(session);
      setBexUser(bexUser);
      setInitialized(true);
    });

    return () => {
      cancelled = true;
    };
  }, [setFirebaseUser, setBexUser, setInitialized]);

  if (!isInitialized) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider theme={theme}>
        <SafeAreaProvider>
          <ErrorBoundary>
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
                <Stack.Screen name="user/[id]" />
              </Stack>
            </ToastProvider>
          </ErrorBoundary>
        </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  splash: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
