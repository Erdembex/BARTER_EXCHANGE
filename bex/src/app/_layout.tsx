import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { authService } from '@/features/auth/authService';
import { useAuthStore } from '@/store/authStore';
import { Colors } from '@/theme';
import { loadDevProfiles } from '@/lib/devProfileStore';

export default function RootLayout() {
  const { setFirebaseUser, setBexUser, setInitialized, isInitialized } =
    useAuthStore();

  useEffect(() => {
    loadDevProfiles();
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
    <>
      <StatusBar style="dark" backgroundColor={Colors.background} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(business)" />
        <Stack.Screen name="task" />
      </Stack>
    </>
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
