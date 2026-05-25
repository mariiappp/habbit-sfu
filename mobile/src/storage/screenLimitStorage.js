import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'screen_time_limit_hours_v1';
const DEFAULT_LIMIT_HOURS = 4;

async function isSecureStoreAvailable() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch (error) {
    return false;
  }
}

export async function getScreenLimitHours() {
  try {
    if (await isSecureStoreAvailable()) {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY);
      const parsed = raw ? Number(raw) : NaN;
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return DEFAULT_LIMIT_HOURS;
      }
      return parsed;
    }
  } catch (error) {
    // Ignore and fallback to AsyncStorage.
  }

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? Number(raw) : NaN;
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return DEFAULT_LIMIT_HOURS;
    }
    return parsed;
  } catch (error) {
    return DEFAULT_LIMIT_HOURS;
  }
}

export async function setScreenLimitHours(value) {
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return DEFAULT_LIMIT_HOURS;
  }
  try {
    if (await isSecureStoreAvailable()) {
      await SecureStore.setItemAsync(STORAGE_KEY, String(normalized));
      return normalized;
    }
  } catch (error) {
    // Ignore and fallback to AsyncStorage.
  }

  try {
    await AsyncStorage.setItem(STORAGE_KEY, String(normalized));
  } catch (error) {
    return DEFAULT_LIMIT_HOURS;
  }
  return normalized;
}
