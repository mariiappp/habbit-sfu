import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'habits_cache';

async function isSecureStoreAvailable() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch (error) {
    console.warn('SecureStore unavailable:', error);
    return false;
  }
}

export async function getHabitsCache() {
  if (await isSecureStoreAvailable()) {
    const data = await SecureStore.getItemAsync(CACHE_KEY);
    return data ? JSON.parse(data) : null;
  }

  try {
    const data = await AsyncStorage.getItem(CACHE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn('AsyncStorage unavailable:', error);
    return null;
  }
}

export async function setHabitsCache(cache) {
  const data = JSON.stringify(cache);
  if (await isSecureStoreAvailable()) {
    await SecureStore.setItemAsync(CACHE_KEY, data);
    return;
  }

  try {
    await AsyncStorage.setItem(CACHE_KEY, data);
  } catch (error) {
    console.warn('AsyncStorage unavailable:', error);
  }
}

export async function clearHabitsCache() {
  if (await isSecureStoreAvailable()) {
    await SecureStore.deleteItemAsync(CACHE_KEY);
    return;
  }

  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.warn('AsyncStorage unavailable:', error);
  }
}
