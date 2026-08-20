import { Platform } from 'react-native';
import Constants from 'expo-constants';

/** Production API (DNS + SSL) — Expo Go, fiziksel telefon, web */
const PRODUCTION_API = 'https://api.passla.com.tr';
/** Eski ad — hot reload / cache uyumlulugu */
const ORACLE_API = PRODUCTION_API;

/** PC proxy — web tarayici + Android emulator (adb reverse ile) */
const LOCAL_PROXY = 'http://127.0.0.1:8888';

function isAndroidEmulator(): boolean {
  if (Platform.OS !== 'android') return false;
  const model = Constants.platform?.android?.model?.toLowerCase() ?? '';
  const deviceName = Constants.deviceName?.toLowerCase() ?? '';
  return (
    model.includes('sdk') ||
    model.includes('emulator') ||
    deviceName.includes('emulator') ||
    deviceName.includes('sdk')
  );
}

function resolveDefaultApiBaseUrl(): string {
  // Yalnizca Android emulator Oracle'a ulasamaz — PC proxy gerekir
  if (Platform.OS === 'android' && isAndroidEmulator()) {
    return LOCAL_PROXY;
  }
  // Web (PC tarayici), iPhone, gercek Android telefon
  return PRODUCTION_API;
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
