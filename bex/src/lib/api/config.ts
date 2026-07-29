import { Platform } from 'react-native';

function resolveDefaultApiBaseUrl(): string {
  // Web tarayıcısı aynı makinedeki backend'e localhost ile bağlanır
  if (Platform.OS === 'web') {
    return 'http://localhost:8080';
  }
  // Telefon / emülatör — LAN IP (bilgisayarın yerel ağ adresi)
  return 'http://192.168.1.105:8080';
}

/** Spring Boot REST API kök adresi */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || resolveDefaultApiBaseUrl();

/** STOMP WebSocket kök adresi (http→ws, https→wss) */
export function getWebSocketBaseUrl(): string {
  const base = API_BASE_URL.replace(/\/$/, '');
  if (base.startsWith('https://')) return base.replace('https://', 'wss://');
  return base.replace('http://', 'ws://');
}
