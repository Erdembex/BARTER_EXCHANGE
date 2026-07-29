import { Redirect } from 'expo-router';

/** Eski /notifications linklerini drawer ekranına yönlendir */
export default function NotificationsRedirect() {
  return <Redirect href="/(tabs)/notifications" />;
}
