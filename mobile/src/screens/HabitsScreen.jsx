import React, { useMemo, useState } from 'react';
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
} from 'react-native';
import FireIcon from '../../assets/images/Fire.svg';

function normalizeDate(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateKey(date) {
  const d = normalizeDate(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fromDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return normalizeDate(new Date(y, m - 1, d));
}

function isSameDay(a, b) {
  return toDateKey(a) === toDateKey(b);
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

function getWeekRange(date) {
  const d = normalizeDate(date);
  const dow = isoWeekday(d);
  const start = addDays(d, -dow);
  const end = addDays(start, 6);
  return { start, end };
}

const REPEAT_OPTIONS = [
  'Каждый день',
  '3 раза в неделю',
  'Через день',
  'По будням',
];


function createHabit(title, repeatType, createdDate) {
  return {
    id: String(Date.now()),
    title,
    repeatType,
    createdDate: createdDate ?? toDateKey(new Date()),
    completedDates: [],
  };
}

function isHabitCompletedOnDate(habit, date) {
  const key = toDateKey(date);
  return habit.completedDates.includes(key);
}

function isHabitCompletedToday(habit, today) {
  return isHabitCompletedOnDate(habit, today);
}

function toggleHabitCompletionForDate(habit, date) {
  const key = toDateKey(date);
  const already = habit.completedDates.includes(key);
  return {
    ...habit,
    completedDates: already
      ? habit.completedDates.filter((d) => d !== key)
      : [...habit.completedDates, key],
  };
}

function countHabitCompletionsInWeek(habit, dateInWeek) {
  const { start, end } = getWeekRange(dateInWeek);
  return habit.completedDates.filter((key) => {
    const d = fromDateKey(key);
    return d >= start && d <= end;
  }).length;
}

function isHabitRequiredOnDate(habit, date) {
  const d = normalizeDate(date);
  const created = fromDateKey(habit.createdDate);

  if (d < created) return false;

  switch (habit.repeatType) {
    case 'Каждый день':
      return true;

    case 'По будням': {
      const dow = isoWeekday(d); 
      return dow <= 4;
    }

    case 'Через день': {
      const diffMs = d.getTime() - created.getTime();
      const diffDays = Math.round(diffMs / 86400000);
      return diffDays % 2 === 0;
    }

    case '3 раза в неделю':
      return true;

    default:
      return true;
  }
}


function isHabitPlanSatisfied(habit, date, today) {
  if (!isHabitRequiredOnDate(habit, date)) {
    return true;
  }

  switch (habit.repeatType) {
    case 'Каждый день':
    case 'По будням':
    case 'Через день':
      return isHabitCompletedOnDate(habit, date);

    case '3 раза в неделю': {
      const { end: weekEnd } = getWeekRange(date);
      const todayNorm = normalizeDate(today);
      const completions = countHabitCompletionsInWeek(habit, date);

      if (todayNorm < weekEnd) {
        const daysLeft =
          Math.round((weekEnd.getTime() - todayNorm.getTime()) / 86400000) + 1;
        return completions + daysLeft >= 3;
      } else {
        return completions >= 3;
      }
    }

    default:
      return isHabitCompletedOnDate(habit, date);
  }
}


function calculateCurrentStreak(habits, today) {
  if (!habits.length) return 0;

  let streak = 0;
  const todayNorm = normalizeDate(today);

  const earliestCreated = habits.reduce((earliest, h) => {
    const d = fromDateKey(h.createdDate);
    return d < earliest ? d : earliest;
  }, todayNorm);

  let cursor = todayNorm;

  while (cursor >= earliestCreated) {
    const activeHabits = habits.filter((h) => {
      const created = fromDateKey(h.createdDate);
      return normalizeDate(cursor) >= created;
    });

    if (!activeHabits.length) break;

    const allSatisfied = activeHabits.every((h) =>
      isHabitPlanSatisfied(h, cursor, todayNorm)
    );

    if (!allSatisfied) break;

    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export default function HabitsScreen() {
  const [habits, setHabits] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [selectedRepeat, setSelectedRepeat] = useState(REPEAT_OPTIONS[0]);

  const today = useMemo(() => normalizeDate(new Date()), []);

  const streakDays = useMemo(
    () => calculateCurrentStreak(habits, today),
    [habits, today]
  );

  const completedTodayCount = useMemo(
    () => habits.filter((h) => isHabitCompletedToday(h, today)).length,
    [habits, today]
  );

  const handleOpenAddHabit = () => {
    setNewHabitTitle('');
    setSelectedRepeat(REPEAT_OPTIONS[0]);
    setShowModal(true);
  };

  const handleSaveHabit = () => {
    if (!newHabitTitle.trim()) return;

    const habit = createHabit(newHabitTitle.trim(), selectedRepeat);

    setHabits((prev) => [...prev, habit]);
    setShowModal(false);
  };

  const toggleHabit = (id) => {
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id ? toggleHabitCompletionForDate(h, today) : h
      )
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Привычки</Text>

        <View style={styles.streakBlock}>
          <FireIcon width={180} height={180} />
          <Text style={styles.streakNumber}>{streakDays} дней</Text>
          <Text style={styles.streakSubtitle}>ежедневный стрик</Text>
        </View>

        {habits.length > 0 && (
          <View style={styles.progressBarRow}>
            {habits.map((h) => (
              <View
                key={h.id}
                style={[
                  styles.progressSection,
                  isHabitCompletedToday(h, today) &&
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
              subtitle={habit.repeatType}
              completed={isHabitCompletedToday(habit, today)}
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
                !newHabitTitle.trim() && styles.saveButtonDisabled,
              ]}
              activeOpacity={0.9}
              onPress={handleSaveHabit}
            >
              <Text style={styles.saveButtonText}>Сохранить</Text>
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

  title: {
    fontFamily: 'WixMadeforDisplayBold',
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 30,
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