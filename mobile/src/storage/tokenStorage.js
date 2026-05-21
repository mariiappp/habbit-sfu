import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'moodle_token';

async function isSecureStoreAvailable() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch (error) {
    console.warn('SecureStore unavailable:', error);
    return false;
  }
}

export async function getToken() {
  if (await isSecureStoreAvailable()) {
    return SecureStore.getItemAsync(TOKEN_KEY);
  }

  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.warn('AsyncStorage unavailable:', error);
    return null;
  }
}

export async function setToken(token) {
  if (await isSecureStoreAvailable()) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    return;
  }

  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.warn('AsyncStorage unavailable:', error);
  }
}

export async function clearToken() {
  if (await isSecureStoreAvailable()) {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    return;
  }

  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.warn('AsyncStorage unavailable:', error);
  }
}
