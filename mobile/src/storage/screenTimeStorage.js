import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'screen_time_daily_v1';

function formatDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function loadStore() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
}

async function saveStore(store) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    // Ignore persistence errors for now.
  }
}

export function getTodayKey() {
  return formatDateKey(new Date());
}

export async function addScreenTimeSeconds(seconds, dateKey) {
  if (!Number.isFinite(seconds) || seconds <= 0) return;
  const store = await loadStore();
  const key = dateKey || formatDateKey(new Date());
  const current = Number(store[key] || 0);
  store[key] = current + Math.round(seconds);
  await saveStore(store);
}

export async function getScreenTimeSeconds(dateKey) {
  const store = await loadStore();
  const key = dateKey || formatDateKey(new Date());
  return Number(store[key] || 0);
}
