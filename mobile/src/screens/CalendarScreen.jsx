import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';

LocaleConfig.locales.ru = {
  monthNames: [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
  ],
  monthNamesShort: [
    'янв.',
    'февр.',
    'март',
    'апр.',
    'май',
    'июнь',
    'июль',
    'авг.',
    'сент.',
    'окт.',
    'нояб.',
    'дек.',
  ],
  dayNames: [
    'воскресенье',
    'понедельник',
    'вторник',
    'среда',
    'четверг',
    'пятница',
    'суббота',
  ],
  dayNamesShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  today: 'Сегодня',
};

LocaleConfig.defaultLocale = 'ru';

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDayNumber(date) {
  return String(date.getDate()).padStart(2, '0');
}

function getShortMonth(date) {
  const months = [
    'янв',
    'фев',
    'мар',
    'апр',
    'май',
    'июн',
    'июл',
    'авг',
    'сен',
    'окт',
    'ноя',
    'дек',
  ];
  return months[date.getMonth()];
}

function getDaysLeft(deadline) {
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startDeadline = new Date(
    deadline.getFullYear(),
    deadline.getMonth(),
    deadline.getDate()
  );
  return Math.ceil((startDeadline - startToday) / (1000 * 60 * 60 * 24));
}

function getDeadlineColor(deadline) {
  const daysLeft = getDaysLeft(deadline);

  if (daysLeft <= 2) return '#F83603';
  if (daysLeft <= 5) return '#F5A623';
  return '#111111';
}

export default function CalendarScreen() {
  const today = useMemo(() => new Date(), []);
  const todayKey = formatDateKey(today);

  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [showModal, setShowModal] = useState(false);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(todayKey);

  const [tasks, setTasks] = useState([
    {
      id: '1',
      title: 'Задачи к лекции 3',
      type: 'Домашняя работа',
      subject: 'Математический анализ',
      deadline: todayKey,
    },
    {
      id: '2',
      title: 'Итоговый тест',
      type: 'Контрольная работа',
      subject: 'Физика',
      deadline: todayKey,
    },
    {
      id: '3',
      title: 'Абстрактные классы',
      type: 'Лабораторная работа',
      subject: 'Основы программирования',
      deadline: formatDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2)),
    },
    {
      id: '4',
      title: 'Практика по БД',
      type: 'Практическая работа',
      subject: 'Базы данных',
      deadline: formatDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4)),
    },
    {
      id: '5',
      title: 'Мини-проект',
      type: 'Проект',
      subject: 'Архитектура ПО',
      deadline: formatDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 8)),
    },
  ]);

  const tasksForSelectedDate = useMemo(() => {
    return tasks.filter((task) => task.deadline === selectedDate);
  }, [tasks, selectedDate]);

  const urgentDeadlines = useMemo(() => {
    return tasks
      .filter((task) => {
        const deadlineDate = parseDateKey(task.deadline);
        return getDaysLeft(deadlineDate) <= 2;
      })
      .sort((a, b) => parseDateKey(a.deadline) - parseDateKey(b.deadline));
  }, [tasks]);

  const markedDates = useMemo(() => {
    const result = {};

    tasks.forEach((task) => {
      if (!result[task.deadline]) {
        result[task.deadline] = { marked: true, dotColor: '#111111' };
      } else {
        result[task.deadline].marked = true;
        result[task.deadline].dotColor = '#111111';
      }
    });

    result[selectedDate] = {
      ...(result[selectedDate] || {}),
      selected: true,
      selectedColor: '#F83603',
      marked: result[selectedDate]?.marked || false,
      dotColor: result[selectedDate]?.marked ? '#FFFFFF' : undefined,
    };

    return result;
  }, [tasks, selectedDate]);

  const saveTask = () => {
    if (!newTaskTitle.trim() || !newTaskType.trim() || !newTaskDate.trim()) {
      return;
    }

    const parsed = parseDateKey(newTaskDate);
    if (Number.isNaN(parsed.getTime())) {
      return;
    }

    const newTask = {
      id: String(Date.now()),
      title: newTaskTitle.trim(),
      type: newTaskType.trim(),
      subject: newTaskSubject.trim(),
      deadline: newTaskDate,
    };

    setTasks((prev) => [...prev, newTask]);
    setNewTaskTitle('');
    setNewTaskType('');
    setNewTaskSubject('');
    setShowModal(false);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.topTitle}>Календарь</Text>

        <Calendar
          current={selectedDate}
          markedDates={markedDates}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          theme={{
            backgroundColor: '#FFFFFF',
            calendarBackground: '#FFFFFF',
            textSectionTitleColor: '#222222',
            selectedDayBackgroundColor: '#F83603',
            selectedDayTextColor: '#FFFFFF',
            todayTextColor: '#F83603',
            dayTextColor: '#111111',
            textDisabledColor: '#C7C7C7',
            monthTextColor: '#111111',
            arrowColor: '#111111',
            textDayFontSize: 16,
            textMonthFontSize: 30,
            textMonthFontWeight: '800',
            textDayHeaderFontSize: 14,
          }}
          style={styles.calendar}
          firstDay={1}
          hideExtraDays={false}
          enableSwipeMonths
        />

        <Text style={styles.sectionTitle}>Задачи на выбранную дату</Text>

        <View style={styles.cardsBlock}>
          {tasksForSelectedDate.length > 0 ? (
            tasksForSelectedDate.map((task) => <TaskCard key={task.id} task={task} />)
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>На эту дату задач нет</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.addTaskCard}
            activeOpacity={0.85}
            onPress={() => setShowModal(true)}
          >
            <Text style={styles.addTaskText}>Добавить задачу</Text>
            <Text style={styles.addTaskPlus}>+</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Ближайшие дедлайны</Text>

        <View style={styles.cardsBlock}>
          {urgentDeadlines.length > 0 ? (
            urgentDeadlines.map((task) => <TaskCard key={task.id} task={task} />)
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Срочных дедлайнов нет</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowModal(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Новая задача</Text>

            <TextInput
              style={styles.input}
              placeholder="Название"
              placeholderTextColor="#9A9A9A"
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
            />

            <TextInput
              style={styles.input}
              placeholder="Тип задачи"
              placeholderTextColor="#9A9A9A"
              value={newTaskType}
              onChangeText={setNewTaskType}
            />

            <TextInput
              style={styles.input}
              placeholder="Предмет (необязательно)"
              placeholderTextColor="#9A9A9A"
              value={newTaskSubject}
              onChangeText={setNewTaskSubject}
            />

            <TextInput
              style={styles.input}
              placeholder="Дата дедлайна: YYYY-MM-DD"
              placeholderTextColor="#9A9A9A"
              value={newTaskDate}
              onChangeText={setNewTaskDate}
            />

            <TouchableOpacity style={styles.saveButton} onPress={saveTask}>
              <Text style={styles.saveButtonText}>Сохранить</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function TaskCard({ task }) {
  const deadlineDate = parseDateKey(task.deadline);
  const deadlineColor = getDeadlineColor(deadlineDate);

  return (
    <View style={styles.taskCard}>
      <View style={styles.taskDateBlock}>
        <Text style={[styles.taskDay, { color: deadlineColor }]}>
          {formatDayNumber(deadlineDate)}
        </Text>
        <Text style={[styles.taskMonth, { color: deadlineColor }]}>
          {getShortMonth(deadlineDate)}
        </Text>
      </View>

      <View style={styles.taskInfoBlock}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        <Text style={styles.taskType}>{task.type}</Text>

        {!!task.subject && (
          <View style={styles.subjectTag}>
            <Text style={styles.subjectTagText}>{task.subject}</Text>
          </View>
        )}
      </View>

      <View style={styles.arrowCircle}>
        <Text style={styles.arrowText}>↗</Text>
      </View>
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
    paddingBottom: 24,
  },

  topTitle: {
    fontFamily: 'WixMadeforDisplayBold',
    fontSize: 20,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 24,
  },

  calendar: {
    borderRadius: 24,
    marginBottom: 28,
  },

  sectionTitle: {
    fontFamily: 'WixMadeforDisplayBold',
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 14,
  },

  cardsBlock: {
    marginBottom: 28,
    gap: 14,
  },

  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 8,
  },
  taskDateBlock: {
    width: 48,
    alignItems: 'center',
    marginRight: 14,
  },
  taskDay: {
    fontFamily: 'WixMadeforDisplayBold',
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '800',
  },
  taskMonth: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  taskInfoBlock: {
    flex: 1,
  },
  taskTitle: {
    fontFamily: 'WixMadeforDisplayBold',
    fontSize: 17,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 6,
  },
  taskType: {
    fontSize: 14,
    color: '#222222',
    marginBottom: 8,
  },
  subjectTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#9CA6FF',
    backgroundColor: '#F8F9FF',
  },
  subjectTagText: {
    fontSize: 11,
    color: '#6A73E5',
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F83603',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  arrowText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: -1,
  },

  addTaskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 8,
  },
  addTaskText: {
    fontFamily: 'WixMadeforDisplayBold',
    fontSize: 17,
    fontWeight: '700',
    color: '#111111',
  },
  addTaskPlus: {
    fontSize: 30,
    color: '#111111',
    fontWeight: '400',
    lineHeight: 30,
  },

  emptyCard: {
    backgroundColor: '#F2F7FB',
    borderRadius: 24,
    padding: 18,
  },
  emptyText: {
    fontSize: 15,
    color: '#666666',
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
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F2F7FB',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111111',
    marginBottom: 12,
  },
  saveButton: {
    marginTop: 4,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#F83603',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontFamily: 'WixMadeforDisplayBold',
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});