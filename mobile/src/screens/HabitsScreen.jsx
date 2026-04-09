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
  SafeAreaView
} from 'react-native';
import FireIcon from '../../assets/images/Fire.svg';

const repeatOptions = [
  'Каждый день',
  '3 раза в неделю',
  '5 раз в неделю',
  'Через день',
  'По будням',
];

export default function HabitsScreen() {
  const [habits, setHabits] = useState([
    {
      id: 1,
      title: 'Тренировка',
      subtitle: '3 раза в неделю',
      completed: true,
    },
    {
      id: 2,
      title: 'Экран меньше 4 часов',
      subtitle: 'Каждый день',
      completed: true,
    },
    {
      id: 3,
      title: 'Отход ко сну до 23:00',
      subtitle: 'Каждый день',
      completed: true,
    },
    {
      id: 4,
      title: 'Пить 2 литра воды',
      subtitle: 'Каждый день',
      completed: false,
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [selectedRepeat, setSelectedRepeat] = useState('Каждый день');

  const streakDays = 30;

  const completedCount = useMemo(
    () => habits.filter((habit) => habit.completed).length,
    [habits]
  );

  const totalCount = habits.length;

  const toggleHabit = (id) => {
    setHabits((prev) =>
      prev.map((habit) =>
        habit.id === id
          ? { ...habit, completed: !habit.completed }
          : habit
      )
    );
  };

  const handleOpenAddHabit = () => {
    setNewHabitTitle('');
    setSelectedRepeat('Каждый день');
    setShowModal(true);
  };

  const handleSaveHabit = () => {
    if (!newHabitTitle.trim()) return;

    const newHabit = {
      id: Date.now(),
      title: newHabitTitle.trim(),
      subtitle: selectedRepeat,
      completed: false,
    };

    setHabits((prev) => [...prev, newHabit]);
    setShowModal(false);
    setNewHabitTitle('');
    setSelectedRepeat('Каждый день');
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
          <View style={styles.fireWrapper}>
            <FireIcon width={180} height={180} />
          </View>

          <Text style={styles.streakNumber}>{streakDays} дней</Text>
          <Text style={styles.streakSubtitle}>ежедневный стрик</Text>
        </View>

        <View style={styles.progressBarRow}>
          {habits.map((habit) => (
            <View
              key={habit.id}
              style={[
                styles.progressSection,
                habit.completed && styles.progressSectionActive,
              ]}
            />
          ))}
        </View>

        <View style={styles.listBlock}>
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              title={habit.title}
              subtitle={habit.subtitle}
              completed={habit.completed}
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
            />

            <Text style={styles.repeatTitle}>Регулярность</Text>

            <View style={styles.repeatList}>
              {repeatOptions.map((option) => {
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
              style={styles.saveButton}
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
        style={[
          styles.checkCircle,
          completed && styles.checkCircleCompleted,
        ]}
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
  saveButtonText: {
    fontFamily: 'WixMadeforDisplayBold',
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});