import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import FireIcon from '../../assets/images/Fire.svg';
import API_BASE_URL from '../api/config';
import { getHabitsCache, setHabitsCache } from '../storage/habitsStorage';

const REPEAT_OPTIONS = [
  'Каждый день',
  'Раз в неделю',
  'Раз в месяц',
];

const RECURRENCE_MAP = {
  'Каждый день': 'daily',
  'Раз в неделю': 'weekly',
  'Раз в месяц': 'monthly',
};

const RECURRENCE_LABELS = {
  daily: 'Каждый день',
  weekly: 'Раз в неделю',
  monthly: 'Раз в месяц',
};

function parseDateKey(dateString) {
  if (!dateString) return new Date(NaN);
  const [y, m, d] = dateString.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function normalizeDate(value) {
  if (!value) return new Date(NaN);
  if (typeof value === 'string') {
    const dateKey = value.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      const parsed = parseDateKey(dateKey);
      parsed.setHours(0, 0, 0, 0);
      return parsed;
    }
  }
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateKey(date) {
  if (!date) return '';
  if (typeof date === 'string') {
    return date.slice(0, 10);
  }
  const d = normalizeDate(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(date, n) {
  const d = normalizeDate(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isoWeekday(date) {
  const d = normalizeDate(date);
  return (d.getDay() + 6) % 7;
}

function getWeekStart(date) {
  const d = normalizeDate(date);
  const diff = isoWeekday(d);
  return addDays(d, -diff);
}

function getWeekEnd(date) {
  return addDays(getWeekStart(date), 6);
}

function getMonthStart(date) {
  const d = normalizeDate(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function getMonthEnd(date) {
  const d = normalizeDate(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function hasCompletionInRange(completionSet, start, end) {
  if (!completionSet || completionSet.size === 0) return false;
  let cursor = normalizeDate(start);
  const endDate = normalizeDate(end);
  while (cursor <= endDate) {
    if (completionSet.has(toDateKey(cursor))) {
      return true;
    }
    cursor = addDays(cursor, 1);
  }
  return false;
}

function isHabitActiveOnDate(habit, date) {
  if (!habit?.created_at) return true;
  return normalizeDate(date) >= normalizeDate(habit.created_at);
}

function isHabitSatisfiedForDate(habit, date, completionSet) {
  if (!isHabitActiveOnDate(habit, date)) return true;
  const dateKey = toDateKey(date);

  switch (habit.recurrence) {
    case 'daily':
      return completionSet?.has(dateKey) ?? false;
    case 'weekly': {
      const start = getWeekStart(date);
      const end = getWeekEnd(date);
      const activeStart = normalizeDate(habit.created_at) > start ? normalizeDate(habit.created_at) : start;
      return hasCompletionInRange(completionSet, activeStart, end);
    }
    case 'monthly': {
      const start = getMonthStart(date);
      const end = getMonthEnd(date);
      const activeStart = normalizeDate(habit.created_at) > start ? normalizeDate(habit.created_at) : start;
      return hasCompletionInRange(completionSet, activeStart, end);
    }
    default:
      return completionSet?.has(dateKey) ?? false;
  }
}

function withToken(path, token) {
  if (!token) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}wstoken=${encodeURIComponent(token)}`;
}

async function apiRequest(path, token, options = {}) {
  const response = await fetch(`${API_BASE_URL}${withToken(path, token)}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `HTTP ${response.status}`);
  }

  return text ? JSON.parse(text) : null;
}

async function fetchHabits(token) {
  return apiRequest('/habits', token, { method: 'GET' });
}

async function createHabit(token, payload) {
  return apiRequest('/habits', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function fetchCompletions(token, habitId, limit = 365) {
  return apiRequest(`/habits/${habitId}/completions?limit=${limit}`, token, {
    method: 'GET',
  });
}

async function createCompletion(token, habitId) {
  return apiRequest(`/habits/${habitId}/completions`, token, {
    method: 'POST',
    body: JSON.stringify({ note: null }),
  });
}

async function deleteCompletion(token, habitId, completionId) {
  return apiRequest(`/habits/${habitId}/completions/${completionId}`, token, {
    method: 'DELETE',
  });
}

function buildCompletionIndex(completions) {
  const idByDate = {};
  const dates = [];

  completions.forEach((item) => {
    const dateKey = toDateKey(item.completed_at);
    if (!idByDate[dateKey]) {
      dates.push(dateKey);
    }
    idByDate[dateKey] = item.id;
  });

  return { dates, idByDate };
}

function getHabitSubtitle(habit) {
  return RECURRENCE_LABELS[habit.recurrence] || 'По расписанию';
}

export default function HabitsScreen({ accessToken }) {
  const [habits, setHabits] = useState([]);
  const [completionsByHabit, setCompletionsByHabit] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingHabitIds, setPendingHabitIds] = useState({});

  const [showModal, setShowModal] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [selectedRepeat, setSelectedRepeat] = useState(REPEAT_OPTIONS[0]);
  const [isSaving, setIsSaving] = useState(false);

  const todayDate = useMemo(() => normalizeDate(new Date()), []);
  const todayKey = useMemo(() => toDateKey(todayDate), [todayDate]);

  useEffect(() => {
    let isMounted = true;

    const loadCache = async () => {
      try {
        const cached = await getHabitsCache();
        if (!isMounted || !cached) return;
        setHabits(cached.habits || []);
        setCompletionsByHabit(cached.completions || {});
      } catch (error) {
        console.warn('Failed to load habits cache:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCache();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const syncHabits = async () => {
      if (!accessToken) return;
      setIsSyncing(true);

      try {
        const remoteHabits = await fetchHabits(accessToken);
        const completionEntries = await Promise.all(
          remoteHabits.map(async (habit) => {
            const completions = await fetchCompletions(accessToken, habit.id);
            return [habit.id, buildCompletionIndex(completions || [])];
          })
        );
        const nextCompletions = Object.fromEntries(completionEntries);

        if (!isMounted) return;
        setHabits(remoteHabits);
        setCompletionsByHabit(nextCompletions);
      } catch (error) {
        console.warn('Failed to sync habits:', error);
        if (isMounted) {
          Alert.alert('Ошибка', 'Не удалось загрузить привычки.');
        }
      } finally {
        if (isMounted) {
          setIsSyncing(false);
        }
      }
    };

    syncHabits();

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!habits.length && !Object.keys(completionsByHabit).length) return;
    setHabitsCache({
      habits,
      completions: completionsByHabit,
      updatedAt: new Date().toISOString(),
    }).catch((error) => console.warn('Failed to persist habits cache:', error));
  }, [habits, completionsByHabit]);

  const completionSets = useMemo(() => {
    const sets = {};
    Object.entries(completionsByHabit).forEach(([habitId, data]) => {
      sets[habitId] = new Set(data?.dates || []);
    });
    return sets;
  }, [completionsByHabit]);

  const streakDays = useMemo(() => {
    if (!habits.length) return 0;
    let streak = 0;
    let cursor = normalizeDate(todayDate);
    const earliest = habits.reduce((minDate, habit) => {
      if (!habit?.created_at) return minDate;
      const created = normalizeDate(habit.created_at);
      return created < minDate ? created : minDate;
    }, cursor);

    while (cursor >= earliest) {
      const allSatisfied = habits.every((habit) =>
        isHabitSatisfiedForDate(habit, cursor, completionSets[habit.id])
      );
      if (!allSatisfied) break;
      streak += 1;
      cursor = addDays(cursor, -1);
    }

    return streak;
  }, [habits, completionSets]);

  const completedTodayCount = useMemo(
    () => habits.filter((habit) =>
      isHabitSatisfiedForDate(habit, todayDate, completionSets[habit.id])
    ).length,
    [habits, completionSets, todayDate]
  );

  const handleOpenAddHabit = () => {
    setNewHabitTitle('');
    setSelectedRepeat(REPEAT_OPTIONS[0]);
    setShowModal(true);
  };

  const handleSaveHabit = async () => {
    if (!newHabitTitle.trim() || isSaving) return;
    if (!accessToken) {
      Alert.alert('Ошибка', 'Нет токена доступа. Перезайдите в аккаунт.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        title: newHabitTitle.trim(),
        description: null,
        recurrence: RECURRENCE_MAP[selectedRepeat] || 'daily',
      };
      const created = await createHabit(accessToken, payload);
      setHabits((prev) => [...prev, created]);
      setCompletionsByHabit((prev) => ({
        ...prev,
        [created.id]: { dates: [], idByDate: {} },
      }));
      setShowModal(false);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось создать привычку.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleHabit = async (habitId) => {
    if (!accessToken) {
      Alert.alert('Ошибка', 'Нет токена доступа. Перезайдите в аккаунт.');
      return;
    }

    if (pendingHabitIds[habitId]) return;

    const existing = completionsByHabit[habitId] || { dates: [], idByDate: {} };
    const todayCompletionId = existing.idByDate?.[todayKey];
    const previous = {
      dates: [...existing.dates],
      idByDate: { ...existing.idByDate },
    };

    const nextDates = todayCompletionId
      ? existing.dates.filter((date) => date !== todayKey)
      : Array.from(new Set([...existing.dates, todayKey]));
    const nextIdByDate = { ...existing.idByDate };
    if (todayCompletionId) {
      delete nextIdByDate[todayKey];
    } else {
      nextIdByDate[todayKey] = null;
    }

    setCompletionsByHabit((prev) => ({
      ...prev,
      [habitId]: { dates: nextDates, idByDate: nextIdByDate },
    }));
    setPendingHabitIds((prev) => ({ ...prev, [habitId]: true }));

    try {
      if (todayCompletionId) {
        await deleteCompletion(accessToken, habitId, todayCompletionId);
        return;
      }

      const created = await createCompletion(accessToken, habitId);
      const completedAt = created?.completed_at ? new Date(created.completed_at) : new Date();
      const createdKey = toDateKey(completedAt);

      setCompletionsByHabit((prev) => {
        const current = prev[habitId] || { dates: [], idByDate: {} };
        const updatedDates = new Set(current.dates);
        updatedDates.add(createdKey);
        if (createdKey !== todayKey) {
          updatedDates.delete(todayKey);
        }
        const updatedIds = { ...current.idByDate };
        updatedIds[createdKey] = created?.id ?? updatedIds[createdKey];
        if (createdKey !== todayKey) {
          delete updatedIds[todayKey];
        }
        return {
          ...prev,
          [habitId]: { dates: Array.from(updatedDates), idByDate: updatedIds },
        };
      });
    } catch (error) {
      setCompletionsByHabit((prev) => ({
        ...prev,
        [habitId]: previous,
      }));
      Alert.alert('Ошибка', 'Не удалось обновить выполнение привычки.');
    } finally {
      setPendingHabitIds((prev) => ({ ...prev, [habitId]: false }));
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#F83603" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>Привычки</Text>
          {isSyncing && <Text style={styles.syncText}>Синхронизация...</Text>}
        </View>

        <View style={styles.streakBlock}>
          <FireIcon width={180} height={180} />
          <Text style={styles.streakNumber}>{streakDays} дней</Text>
          <Text style={styles.streakSubtitle}>ежедневный стрик</Text>
        </View>

        {habits.length > 0 && (
          <View style={styles.progressBarRow}>
            {habits.map((habit) => (
              <View
                key={habit.id}
                style={[
                  styles.progressSection,
                  isHabitSatisfiedForDate(habit, todayDate, completionSets[habit.id]) &&
                    styles.progressSectionActive,
                ]}
              />
            ))}
          </View>
        )}

        <View style={styles.listBlock}>
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              title={habit.title}
              subtitle={getHabitSubtitle(habit)}
              completed={isHabitSatisfiedForDate(habit, todayDate, completionSets[habit.id])}
              onPress={() => toggleHabit(habit.id)}
            />
          ))}

          <TouchableOpacity
            style={styles.addHabitCard}
            activeOpacity={0.85}
            onPress={handleOpenAddHabit}
          >
            <Text style={styles.addHabitText}>Добавить привычку</Text>
            <Text style={styles.addHabitPlus}>+</Text>
          </TouchableOpacity>
        </View>

        {habits.length > 0 && (
          <Text style={styles.completedHint}>
            Выполнено сегодня: {completedTodayCount}/{habits.length}
          </Text>
        )}
      </ScrollView>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowModal(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Новая привычка</Text>

            <TextInput
              style={styles.input}
              placeholder="Название привычки"
              placeholderTextColor="#9A9A9A"
              value={newHabitTitle}
              onChangeText={setNewHabitTitle}
              returnKeyType="done"
            />

            <Text style={styles.repeatTitle}>Регулярность</Text>

            <View style={styles.repeatList}>
              {REPEAT_OPTIONS.map((option) => {
                const selected = selectedRepeat === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.repeatOption,
                      selected && styles.repeatOptionSelected,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => setSelectedRepeat(option)}
                  >
                    <Text
                      style={[
                        styles.repeatOptionText,
                        selected && styles.repeatOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                (!newHabitTitle.trim() || isSaving) && styles.saveButtonDisabled,
              ]}
              activeOpacity={0.9}
              onPress={handleSaveHabit}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Сохранить</Text>
              )}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function HabitCard({ title, subtitle, completed, onPress }) {
  return (
    <View style={styles.habitCard}>
      <View style={styles.habitTextBlock}>
        <Text style={styles.habitTitle}>{title}</Text>
        <Text style={styles.habitSubtitle}>{subtitle}</Text>
      </View>
      <TouchableOpacity
        style={[styles.checkCircle, completed && styles.checkCircleCompleted]}
        activeOpacity={0.8}
        onPress={onPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  title: {
    fontFamily: 'WixMadeforDisplayBold',
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
  },
  syncText: {
    fontSize: 12,
    color: '#9A9A9A',
    fontFamily: 'WixMadeforDisplayMedium',
  },
  streakBlock: {
    alignItems: 'center',
    marginBottom: 50,
  },
  streakNumber: {
    fontFamily: 'WixMadeforDisplayBold',
    fontSize: 40,
    fontWeight: '800',
    color: '#111111',
    lineHeight: 40,
  },
  streakSubtitle: {
    fontFamily: 'WixMadeforDisplayMedium',
    marginTop: 4,
    fontSize: 15,
    color: '#222222',
  },
  progressBarRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  progressSection: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#FFD8CB',
  },
  progressSectionActive: {
    backgroundColor: '#F83603',
  },
  listBlock: {
    gap: 16,
  },
  habitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
  },
  habitTextBlock: {
    flex: 1,
    paddingRight: 16,
  },
  habitTitle: {
    fontFamily: 'WixMadeforDisplayBold',
    fontSize: 17,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 10,
  },
  habitSubtitle: {
    fontSize: 14,
    color: '#333333',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#111111',
    backgroundColor: '#FFFFFF',
  },
  checkCircleCompleted: {
    borderColor: '#F83603',
    backgroundColor: '#F83603',
  },
  addHabitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
  },
  addHabitText: {
    fontFamily: 'WixMadeforDisplayBold',
    fontSize: 17,
    fontWeight: '600',
    color: '#111111',
  },
  addHabitPlus: {
    fontSize: 28,
    lineHeight: 28,
    color: '#111111',
    fontWeight: '400',
  },
  completedHint: {
    marginTop: 16,
    fontFamily: 'WixMadeforDisplayMedium',
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.24)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
  },
  modalTitle: {
    fontFamily: 'WixMadeforDisplayBold',
    fontSize: 22,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 18,
  },
  input: {
    fontFamily: 'WixMadeforDisplayMedium',
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F2F7FB',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111111',
    marginBottom: 18,
  },
  repeatTitle: {
    fontFamily: 'WixMadeforDisplayBold',
    fontSize: 16,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 10,
  },
  repeatList: {
    marginBottom: 20,
  },
  repeatOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#F7F7F7',
    marginBottom: 10,
  },
  repeatOptionSelected: {
    backgroundColor: '#FFF0EB',
    borderWidth: 1,
    borderColor: '#F83603',
  },
  repeatOptionText: {
    fontFamily: 'WixMadeforDisplayMedium',
    fontSize: 15,
    color: '#222222',
  },
  repeatOptionTextSelected: {
    color: '#F83603',
    fontWeight: '600',
  },
  saveButton: {
    height: 54,
    borderRadius: 18,
    backgroundColor: '#F83603',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.45,
  },
  saveButtonText: {
    fontFamily: 'WixMadeforDisplayBold',
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
