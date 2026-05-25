import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  TextInput,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';

import API_BASE_URL from '../api/config';

LocaleConfig.locales.ru = {
  monthNames: [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
  ],
  monthNamesShort: [
    'янв.', 'февр.', 'март', 'апр.', 'май', 'июнь',
    'июль', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.',
  ],
  dayNames: [
    'воскресенье', 'понедельник', 'вторник', 'среда',
    'четверг', 'пятница', 'суббота',
  ],
  dayNamesShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
  today: 'Сегодня',
};
LocaleConfig.defaultLocale = 'ru';

function normalizeDate(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateKey(date) {
  const d = normalizeDate(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDateKey(dateString) {
  const [y, m, d] = dateString.split('-').map(Number);
  return normalizeDate(new Date(y, m - 1, d));
}

function isDateValid(dateString) {
  if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  const d = parseDateKey(dateString);
  return !isNaN(d.getTime());
}

function formatDayNumber(date) {
  return String(date.getDate()).padStart(2, '0');
}

const SHORT_MONTHS = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];

function getShortMonth(date) {
  return SHORT_MONTHS[date.getMonth()];
}

function getMonthStart(date) {
  const d = normalizeDate(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function getMonthEnd(date) {
  const d = normalizeDate(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function getDaysLeft(deadlineDate, today) {
  const todayNorm = normalizeDate(today);
  const deadlineNorm = normalizeDate(deadlineDate);
  return Math.ceil((deadlineNorm - todayNorm) / (1000 * 60 * 60 * 24));
}

function isTaskExpired(task, today) {
  if (!isDateValid(task.deadline)) return true;
  const daysLeft = getDaysLeft(parseDateKey(task.deadline), today);
  return daysLeft < 0;
}

function getActiveTasks(tasks, today) {
  return tasks.filter((task) => !isTaskExpired(task, today));
}

function getTasksForDate(tasks, selectedDateKey) {
  return tasks.filter((task) => task.deadline === selectedDateKey);
}

function getUrgentTasks(tasks, today) {
  return getActiveTasks(tasks, today)
    .filter((task) => {
      const daysLeft = getDaysLeft(parseDateKey(task.deadline), today);
      return daysLeft >= 0 && daysLeft <= 2;
    })
    .sort((a, b) => parseDateKey(a.deadline) - parseDateKey(b.deadline));
}

function getDeadlineColor(deadlineDate, today) {
  const daysLeft = getDaysLeft(deadlineDate, today);
  if (daysLeft <= 2) return '#F83603';
  if (daysLeft <= 5) return '#F5A623';
  return '#111111';
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

async function fetchTasks(token, startDate, endDate) {
  const params = new URLSearchParams();
  if (startDate) params.set('start_date', startDate);
  if (endDate) params.set('end_date', endDate);
  const query = params.toString();
  return apiRequest(`/tasks${query ? `?${query}` : ''}`, token, { method: 'GET' });
}

async function createTask(token, payload) {
  return apiRequest('/tasks', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function updateTask(token, taskId, payload) {
  return apiRequest(`/tasks/${taskId}`, token, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

async function deleteTask(token, taskId) {
  return apiRequest(`/tasks/${taskId}`, token, {
    method: 'DELETE',
  });
}

function normalizeTask(task) {
  return {
    id: String(task.id),
    title: task.title,
    type: task.task_type || 'Задача',
    subject: task.subject || '',
    deadline: task.deadline,
    link: task.link || '',
    isDone: Boolean(task.is_done),
  };
}

function mergeCustomStyles(existing, nextStyles) {
  const prev = existing?.customStyles || {};
  return {
    ...existing,
    customStyles: {
      container: { ...(prev.container || {}), ...(nextStyles.container || {}) },
      text: { ...(prev.text || {}), ...(nextStyles.text || {}) },
    },
  };
}

function buildMarkedDates(tasks, selectedDateKey, todayKey) {
  const result = {};
  const markColor = '#F83603';
  const todayBg = '#FFF1EB';

  tasks.forEach((task) => {
    if (!task.deadline) return;
    const existing = result[task.deadline];
    result[task.deadline] = mergeCustomStyles(existing, {
      container: {
        borderColor: markColor,
        borderWidth: 1,
        borderRadius: 999,
      },
    });
  });

  if (todayKey) {
    const existing = result[todayKey];
    result[todayKey] = mergeCustomStyles(existing, {
      container: {
        backgroundColor: todayBg,
        borderRadius: 999,
      },
      text: { color: '#F83603' },
    });
  }

  if (selectedDateKey) {
    const existing = result[selectedDateKey];
    result[selectedDateKey] = mergeCustomStyles(existing, {
      container: {
        backgroundColor: markColor,
        borderColor: markColor,
        borderWidth: 1,
        borderRadius: 999,
      },
      text: { color: '#FFFFFF' },
    });
  }

  return result;
}

export default function CalendarScreen({ accessToken }) {
  const today = useMemo(() => normalizeDate(new Date()), []);
  const todayKey = useMemo(() => formatDateKey(today), [today]);

  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(today);
  const [pendingTaskIds, setPendingTaskIds] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(todayKey);
  const [newTaskLink, setNewTaskLink] = useState('');

  const loadTasksForMonth = useCallback(
    async (date) => {
      if (!accessToken) {
        setTasks([]);
        setIsLoading(false);
        return;
      }

      setIsSyncing(true);
      try {
        const start = formatDateKey(getMonthStart(date));
        const end = formatDateKey(getMonthEnd(date));
        const data = await fetchTasks(accessToken, start, end);
        const normalized = Array.isArray(data) ? data.map(normalizeTask) : [];
        setTasks(normalized);
      } catch (error) {
        Alert.alert('Ошибка', 'Не удалось загрузить задачи календаря.');
      } finally {
        setIsLoading(false);
        setIsSyncing(false);
      }
    },
    [accessToken]
  );

  useFocusEffect(
    useCallback(() => {
      loadTasksForMonth(visibleMonth);
      return () => {};
    }, [loadTasksForMonth, visibleMonth])
  );

  const activeTasks = useMemo(() => getActiveTasks(tasks, today), [tasks, today]);
  const tasksForDate = useMemo(
    () => getTasksForDate(tasks, selectedDate),
    [tasks, selectedDate]
  );
  const urgentTasks = useMemo(() => getUrgentTasks(tasks, today), [tasks, today]);
  const markedDates = useMemo(
    () => buildMarkedDates(tasks, selectedDate, todayKey),
    [tasks, selectedDate, todayKey]
  );

  const hasAnyActiveTasks = activeTasks.length > 0;

  const handleOpenModal = () => {
    setEditingTask(null);
    setNewTaskTitle('');
    setNewTaskType('');
    setNewTaskSubject('');
    setNewTaskDate(selectedDate);
    setNewTaskLink('');
    setShowModal(true);
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setNewTaskTitle(task.title || '');
    setNewTaskType(task.type || '');
    setNewTaskSubject(task.subject || '');
    setNewTaskDate(task.deadline || selectedDate);
    setNewTaskLink(task.link || '');
    setShowModal(true);
  };

  const handleSaveTask = async () => {
    if (!newTaskTitle.trim() || !newTaskType.trim()) return;
    if (!isDateValid(newTaskDate)) return;
    if (!accessToken) {
      Alert.alert('Ошибка', 'Нет токена доступа. Перезайдите в аккаунт.');
      return;
    }

    if (!editingTask) {
      const daysLeft = getDaysLeft(parseDateKey(newTaskDate), today);
      if (daysLeft < 0) {
        Alert.alert('Ошибка', 'Нельзя добавлять задачи на прошедшую дату.');
        return;
      }
    }

    try {
      const payload = {
        title: newTaskTitle.trim(),
        task_type: newTaskType.trim(),
        subject: newTaskSubject.trim() || null,
        deadline: newTaskDate,
        link: newTaskLink.trim() || null,
      };
      if (editingTask) {
        const updated = await updateTask(accessToken, editingTask.id, payload);
        if (updated) {
          const normalized = normalizeTask(updated);
          setTasks((prev) =>
            prev.map((task) => (task.id === normalized.id ? normalized : task))
          );
        }
      } else {
        const created = await createTask(accessToken, payload);
        if (created) {
          setTasks((prev) => [...prev, normalizeTask(created)]);
        }
      }
      setShowModal(false);
    } catch (error) {
      Alert.alert('Ошибка', editingTask ? 'Не удалось обновить задачу.' : 'Не удалось создать задачу.');
    }
  };

  const handleDeleteTask = async () => {
    if (!editingTask || !accessToken) return;
    try {
      await deleteTask(accessToken, editingTask.id);
      setTasks((prev) => prev.filter((task) => task.id !== String(editingTask.id)));
      setShowModal(false);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось удалить задачу.');
    }
  };

  const toggleTaskDone = async (taskId) => {
    if (!accessToken) {
      Alert.alert('Ошибка', 'Нет токена доступа. Перезайдите в аккаунт.');
      return;
    }
    if (pendingTaskIds[taskId]) return;

    const existing = tasks.find((task) => task.id === String(taskId));
    if (!existing) return;

    const nextDone = !existing.isDone;
    setPendingTaskIds((prev) => ({ ...prev, [taskId]: true }));
    setTasks((prev) =>
      prev.map((task) =>
        task.id === String(taskId) ? { ...task, isDone: nextDone } : task
      )
    );

    try {
      const updated = await updateTask(accessToken, taskId, { is_done: nextDone });
      if (updated) {
        const normalized = normalizeTask(updated);
        setTasks((prev) =>
          prev.map((task) => (task.id === normalized.id ? normalized : task))
        );
      }
    } catch (error) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === String(taskId) ? { ...task, isDone: existing.isDone } : task
        )
      );
      Alert.alert('Ошибка', 'Не удалось обновить задачу.');
    } finally {
      setPendingTaskIds((prev) => ({ ...prev, [taskId]: false }));
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
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
        <Text style={styles.topTitle}>Календарь</Text>

        <Calendar
          current={selectedDate}
          markedDates={markedDates}
          markingType="custom"
          onDayPress={(day) => {
            setSelectedDate(day.dateString);
          }}
          onMonthChange={(month) => {
            setVisibleMonth(new Date(month.year, month.month - 1, 1));
          }}
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

        {!hasAnyActiveTasks && (
          <Text style={styles.emptyHint}>Здесь появятся ваши задачи!</Text>
        )}

        <View style={styles.cardsBlock}>
          {tasksForDate.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              today={today}
              onToggleDone={() => toggleTaskDone(task.id)}
              onPress={() => handleOpenEditModal(task)}
            />
          ))}

          <TouchableOpacity
            style={styles.addTaskCard}
            activeOpacity={0.85}
            onPress={handleOpenModal}
          >
            <Text style={styles.addTaskText}>Добавить задачу</Text>
            <Text style={styles.addTaskPlus}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Ближайшие дедлайны</Text>
          {isSyncing && <Text style={styles.syncText}>Синхронизация...</Text>}
        </View>
        <View style={styles.cardsBlock}>
          {urgentTasks.length > 0 ? (
            urgentTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                today={today}
                onToggleDone={() => toggleTaskDone(task.id)}
                onPress={() => handleOpenEditModal(task)}
              />
            ))
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
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowModal(false)}
        >
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>
              {editingTask ? 'Редактировать задачу' : 'Новая задача'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Название"
              placeholderTextColor="#9A9A9A"
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              returnKeyType="next"
            />

            <TextInput
              style={styles.input}
              placeholder="Тип задачи"
              placeholderTextColor="#9A9A9A"
              value={newTaskType}
              onChangeText={setNewTaskType}
              returnKeyType="next"
            />

            <TextInput
              style={styles.input}
              placeholder="Предмет (необязательно)"
              placeholderTextColor="#9A9A9A"
              value={newTaskSubject}
              onChangeText={setNewTaskSubject}
              returnKeyType="next"
            />

            <TextInput
              style={styles.input}
              placeholder="Дата дедлайна: ГГГГ-ММ-ДД"
              placeholderTextColor="#9A9A9A"
              value={newTaskDate}
              onChangeText={setNewTaskDate}
              keyboardType="numeric"
              returnKeyType="next"
            />

            <TextInput
              style={styles.input}
              placeholder="Ссылка на задачу (необязательно)"
              placeholderTextColor="#9A9A9A"
              value={newTaskLink}
              onChangeText={setNewTaskLink}
              keyboardType="url"
              autoCapitalize="none"
              returnKeyType="done"
            />

            <TouchableOpacity
              style={[
                styles.saveButton,
                (!newTaskTitle.trim() || !newTaskType.trim() || !newTaskDate.trim()) &&
                  styles.saveButtonDisabled,
              ]}
              activeOpacity={0.9}
              onPress={handleSaveTask}
            >
              <Text style={styles.saveButtonText}>Сохранить</Text>
            </TouchableOpacity>

            {editingTask && (
              <TouchableOpacity
                style={styles.deleteButton}
                activeOpacity={0.9}
                onPress={handleDeleteTask}
              >
                <Text style={styles.deleteButtonText}>Удалить</Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function TaskCard({ task, today, onToggleDone, onPress }) {
  const deadlineDate = parseDateKey(task.deadline);
  const deadlineColor = getDeadlineColor(deadlineDate, today);

  const handleLinkPress = () => {
    if (task.link) {
      Linking.openURL(task.link).catch(() => {});
    }
  };

  return (
    <TouchableOpacity
      style={[styles.taskCard, task.isDone && styles.taskCardDone]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.taskDateBlock}>
        <Text style={[styles.taskDay, { color: deadlineColor }]}>
          {formatDayNumber(deadlineDate)}
        </Text>
        <Text style={[styles.taskMonth, { color: deadlineColor }]}>
          {getShortMonth(deadlineDate)}
        </Text>
      </View>

      <View style={styles.taskInfoBlock}>
        <Text style={[styles.taskTitle, task.isDone && styles.taskTitleDone]}>
          {task.title}
        </Text>
        <Text style={[styles.taskType, task.isDone && styles.taskTypeDone]}>
          {task.type}
        </Text>

        {!!task.subject && (
          <View style={styles.subjectTag}>
            <Text style={styles.subjectTagText}>{task.subject}</Text>
          </View>
        )}

        {!!task.link && (
          <TouchableOpacity
            style={styles.linkTag}
            activeOpacity={0.7}
            onPress={handleLinkPress}
          >
            <Text style={styles.linkTagText} numberOfLines={1}>
              🔗 Открыть задачу
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[styles.doneCircle, task.isDone && styles.doneCircleDone]}
        activeOpacity={0.8}
        onPress={onToggleDone}
      >
        <Text style={[styles.doneText, task.isDone && styles.doneTextDone]}>
          {task.isDone ? '✓' : '○'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  topTitle: {
    fontFamily: 'WixMadeforDisplayBold',
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 30,
  },

  calendar: {
    borderRadius: 24,
    marginBottom: 24,
  },

  emptyHint: {
    fontFamily: 'WixMadeforDisplayMedium',
    fontSize: 15,
    color: '#BBBBBB',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 20,
  },

  sectionTitle: {
    fontFamily: 'WixMadeforDisplayBold',
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  syncText: {
    fontSize: 12,
    color: '#9A9A9A',
    fontFamily: 'WixMadeforDisplayMedium',
  },

  cardsBlock: {
    marginBottom: 40,
    gap: 16,
  },

  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 8,
  },
  taskCardDone: {
    opacity: 0.7,
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
    fontFamily: 'WixMadeforDisplayMedium',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  taskInfoBlock: {
    flex: 1,
  },
  taskTitle: {
    fontFamily: 'WixMadeforDisplayBold',
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 6,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
    color: '#666666',
  },
  taskType: {
    fontSize: 14,
    color: '#222222',
    marginBottom: 8,
  },
  taskTypeDone: {
    color: '#777777',
  },
  subjectTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#9CA6FF',
    backgroundColor: '#F8F9FF',
    marginBottom: 6,
  },
  subjectTagText: {
    fontFamily: 'WixMadeforDisplayMedium',
    fontSize: 12,
    color: '#6A73E5',
  },
  linkTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    backgroundColor: '#F7F7F7',
    marginTop: 2,
  },
  linkTagText: {
    fontFamily: 'WixMadeforDisplayMedium',
    fontSize: 12,
    color: '#555555',
    maxWidth: 160,
  },

  doneCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#F83603',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  doneCircleDone: {
    backgroundColor: '#F83603',
  },
  doneText: {
    color: '#F83603',
    fontSize: 14,
    fontWeight: '700',
    marginTop: -1,
  },
  doneTextDone: {
    color: '#FFFFFF',
  },

  addTaskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 20,
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
    borderRadius: 20,
    padding: 18,
  },
  emptyText: {
    fontFamily: 'WixMadeforDisplayMedium',
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
    fontSize: 20,
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
  saveButtonDisabled: {
    opacity: 0.45,
  },
  saveButtonText: {
    fontFamily: 'WixMadeforDisplayBold',
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  deleteButton: {
    marginTop: 12,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F83603',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontFamily: 'WixMadeforDisplayBold',
    color: '#F83603',
    fontSize: 16,
    fontWeight: '700',
  },
});