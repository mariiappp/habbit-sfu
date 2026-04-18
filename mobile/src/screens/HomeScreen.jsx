import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';

import AdviceStar from '../../assets/images/homeScreenIcons/AdviceStar.svg';
import Habits from '../../assets/images/homeScreenIcons/Habits.svg';
import Lock from '../../assets/images/homeScreenIcons/Lock.svg';
import ScreenTime from '../../assets/images/homeScreenIcons/ScreenTime.svg';
import Tasks from '../../assets/images/homeScreenIcons/Tasks.svg';

const API_BASE_URL = 'https://your-backend-domain/api/v1';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getTodayDateString = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

const getWeekDayOrder = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const createEmptyProductivityData = () =>
  getWeekDayOrder.map((day) => ({ day, value: 0 }));

const calculateBalance = ({
  tasksDone,
  tasksTotal,
  habitsDone,
  habitsTotal,
  screenTimeHours,
  screenLimitHours,
}) => {
  const safeTasksTotal = tasksTotal > 0 ? tasksTotal : 1;
  const safeHabitsTotal = habitsTotal > 0 ? habitsTotal : 1;
  const safeScreenLimit = screenLimitHours > 0 ? screenLimitHours : 1;

  const tasksProgress = clamp(tasksDone / safeTasksTotal, 0, 1);
  const habitsProgress = clamp(habitsDone / safeHabitsTotal, 0, 1);
  const screenTimeScore = clamp(1 - screenTimeHours / safeScreenLimit, 0, 1);

  return Math.round(((tasksProgress + habitsProgress + screenTimeScore) / 3) * 100);
};

async function getDeviceScreenTimeHours() {
  try {
    return 0;
  } catch (error) {
    console.log('Не удалось получить экранное время устройства:', error);
    return 0;
  }
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}`);
  }

  return response.json();
}

async function fetchHomeDashboard({ date, token }) {
  return apiRequest(`/dashboard/home?date=${date}`, {
    method: 'GET',
    headers: token
      ? {
        Authorization: `Bearer ${token}`,
      }
      : {},
  });
}

async function fetchDailyAdvice({ date, token }) {
  return apiRequest(`/advice/daily?date=${date}`, {
    method: 'GET',
    headers: token
      ? {
        Authorization: `Bearer ${token}`,
      }
      : {},
  });
}

export default function HomeScreen() {

  const accessToken = null;

  const [isLoading, setIsLoading] = useState(true);

  const [userName, setUserName] = useState('Иван');

  const [tasksDone, setTasksDone] = useState(0);
  const [tasksTotal, setTasksTotal] = useState(0);

  const [habitsDone, setHabitsDone] = useState(0);
  const [habitsTotal, setHabitsTotal] = useState(0);

  const [screenTime, setScreenTime] = useState(0);
  const [screenLimit] = useState(4);

  const [dailyAdvice, setDailyAdvice] = useState('Совет дня недоступен');
  const [adviceProgress, setAdviceProgress] = useState(0);
  const [adviceLocked, setAdviceLocked] = useState(true);

  const [weeklyStats, setWeeklyStats] = useState({
    missedDeadlines: 0,
    completedTasks: 0,
    averageBalance: 0,
    averageScreenTime: 0,
  });

  const [productivityData, setProductivityData] = useState(createEmptyProductivityData());

  const balance = useMemo(() => {
    return calculateBalance({
      tasksDone,
      tasksTotal,
      habitsDone,
      habitsTotal,
      screenTimeHours: screenTime,
      screenLimitHours: screenLimit,
    });
  }, [tasksDone, tasksTotal, habitsDone, habitsTotal, screenTime, screenLimit]);

  useEffect(() => {
    let isMounted = true;

    const loadHomeData = async () => {
      try {
        setIsLoading(true);

        const today = getTodayDateString();

        const [deviceScreenTime, dashboard, advice] = await Promise.all([
          getDeviceScreenTimeHours(),
          fetchHomeDashboard({
            date: today,
            token: accessToken,
          }).catch(() => null),
          fetchDailyAdvice({
            date: today,
            token: accessToken,
          }).catch(() => null),
        ]);

        if (!isMounted) return;

        setScreenTime(deviceScreenTime);

        if (dashboard) {
          setUserName(dashboard?.user?.firstName || 'Иван');

          setTasksDone(dashboard?.tasks?.done ?? 0);
          setTasksTotal(dashboard?.tasks?.total ?? 0);

          setHabitsDone(dashboard?.habits?.done ?? 0);
          setHabitsTotal(dashboard?.habits?.total ?? 0);

          setWeeklyStats({
            missedDeadlines: dashboard?.weeklySummary?.missedDeadlines ?? 0,
            completedTasks: dashboard?.weeklySummary?.completedTasks ?? 0,
            averageBalance: dashboard?.weeklySummary?.averageBalance ?? 0,
            averageScreenTime: dashboard?.weeklySummary?.averageScreenTime ?? 0,
          });

          if (Array.isArray(dashboard?.productivityChart) && dashboard.productivityChart.length > 0) {
            const normalizedChart = getWeekDayOrder.map((day) => {
              const found = dashboard.productivityChart.find((item) => item.day === day);
              return {
                day,
                value: found?.value ?? 0,
              };
            });
            setProductivityData(normalizedChart);
          } else {
            setProductivityData(createEmptyProductivityData());
          }
        }

        if (advice) {
          setDailyAdvice(advice?.text || 'Совет дня недоступен');
          setAdviceProgress(advice?.progress ?? 0);
          setAdviceLocked(advice?.locked ?? true);
        } else if (dashboard?.advice) {
          setDailyAdvice(dashboard.advice.text || 'Совет дня недоступен');
          setAdviceProgress(dashboard.advice.progress ?? 0);
          setAdviceLocked(dashboard.advice.locked ?? true);
        } else {
          setDailyAdvice('Совет дня недоступен');
          setAdviceProgress(0);
          setAdviceLocked(true);
        }
      } catch (error) {
        console.log('Ошибка загрузки главного экрана:', error);
        if (isMounted) {
          Alert.alert('Ошибка', 'Не удалось загрузить данные главного экрана');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadHomeData();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Тестовые кнопки оставлены.
   * Они теперь изменяют только локальное состояние для отладки UI.
   * При желании их можно удалить, когда backend будет полностью подключен.
   */


  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.greeting}>
          {isLoading ? 'Добрый день!' : `Добрый день, ${userName}!`}
        </Text>

        <View style={styles.progressWrapper}>
          <CircularBalance value={balance} />
        </View>

        <View style={styles.metricsBlock}>
          <MetricRow
            Icon={Tasks}
            label="Задачи"
            value={`${tasksDone}/${tasksTotal}`}
            iconBg="#DFF8C8"
          />
          <MetricRow
            Icon={Habits}
            label="Привычки"
            value={`${habitsDone}/${habitsTotal}`}
            iconBg="#FFE5D9"
          />
          <MetricRow
            Icon={ScreenTime}
            label="Экранное время"
            value={`${screenTime}/${screenLimit} ч`}
            iconBg="#E3E8FF"
            isLast
          />
        </View>

        <Text style={styles.sectionTitle}>Совет дня</Text>

        <AdviceCard
          text={dailyAdvice}
          progress={adviceProgress}
          locked={adviceLocked}
        />

        <Text style={styles.sectionTitle}>Еженедельная сводка</Text>

        <View style={styles.summaryGrid}>
          <SummaryCard
            title="Пропущенных дедлайнов"
            value={weeklyStats.missedDeadlines}
            suffix=""
            valueColor="#FFBE80"
          />
          <SummaryCard
            title="Выполненных задач"
            value={weeklyStats.completedTasks}
            suffix=""
            valueColor="#F0B5FF"
          />
          <SummaryCard
            title="Средний баланс дня"
            value={weeklyStats.averageBalance}
            suffix="%"
            valueColor="#9CEE8F"
          />
          <SummaryCard
            title="Среднее экранное время"
            value={weeklyStats.averageScreenTime}
            suffix=" ч."
            valueColor="#AEB8FF"
          />
        </View>

        <Text style={styles.sectionTitle}>Продуктивность</Text>
        <ProductivityChart data={productivityData} />
      </ScrollView>
    </SafeAreaView>
  );
}

function CircularBalance({ value }) {
  const size = 190;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (circumference * value) / 100;

  return (
    <View style={styles.circleContainer}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="balanceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FFB7A6" />
            <Stop offset="50%" stopColor="#A9A5FF" />
            <Stop offset="100%" stopColor="#FF5A2C" />
          </LinearGradient>
        </Defs>

        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#EFEFEF"
          strokeWidth={strokeWidth}
          fill="none"
        />

        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#balanceGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>

      <View style={styles.circleContent}>
        <Text style={styles.circlePercent}>{value}%</Text>
        <Text style={styles.circleLabel}>Баланс дня</Text>
      </View>
    </View>
  );
}

function MetricRow({ Icon, label, value, iconBg, isLast = false }) {
  return (
    <View style={[styles.metricRow, isLast && styles.metricRowLast]}>
      <View style={[styles.metricIconWrapper, { backgroundColor: iconBg }]}>
        <Icon width={25} height={25} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function AdviceCard({ text, progress, locked }) {
  return (
    <View style={styles.adviceCard}>
      <View style={styles.adviceTopRow}>
        <View style={styles.adviceLeftIconColumn}>
          <AdviceStar width={28} height={28} />
        </View>

        <View style={styles.adviceTextColumn}>
          <Text style={styles.adviceText}>{text}</Text>
        </View>
      </View>

      <View style={styles.adviceProgressRow}>
        <Lock width={20} height={20} style={styles.lockSvg} />
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${clamp(progress, 0, 100)}%` },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

function SummaryCard({ title, value, suffix, valueColor }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>{title}</Text>
      <View style={styles.summaryValueRow}>
        <Text style={[styles.summaryValue, { color: valueColor }]}>{value}</Text>
        {!!suffix && <Text style={styles.summarySuffix}>{suffix}</Text>}
      </View>
    </View>
  );
}

function ProductivityChart({ data }) {
  const maxValue = 100;

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartBars}>
        {data.map((item) => {
          const normalizedValue = clamp(item.value ?? 0, 0, 100);
          const barHeight = Math.max(8, (normalizedValue / maxValue) * 88);

          return (
            <View key={item.day} style={styles.chartItem}>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: barHeight }]} />
              </View>
              <Text style={styles.chartDay}>{item.day}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ControlRow({ title, onMinus, onPlus }) {
  return (
    <View style={styles.controlRow}>
      <Text style={styles.controlLabel}>{title}</Text>
      <View style={styles.controlButtons}>
        <TouchableOpacity style={styles.controlButton} onPress={onMinus}>
          <Text style={styles.controlButtonText}>−</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={onPlus}>
          <Text style={styles.controlButtonText}>+</Text>
        </TouchableOpacity>
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
    paddingBottom: 32,
  },
  greeting: {
    fontFamily: 'WixMadeforDisplayBold',
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 50,
  },

  progressWrapper: {
    alignItems: 'center',
    marginBottom: 10,
  },
  circleContainer: {
    width: 190,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  circlePercent: {
    fontFamily: 'WixMadeforDisplayBold',
    fontSize: 45,
    fontWeight: '800',
    color: '#111111',
  },
  circleLabel: {
    fontFamily: 'WixMadeforDisplayBold',
    marginTop: 4,
    fontSize: 14,
    color: '#444444',
  },

  metricsBlock: {
    marginBottom: 50,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
  },
  metricRowLast: {
    borderBottomWidth: 0,
  },
  metricIconWrapper: {
    width: 35,
    height: 35,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  metricLabel: {
    fontFamily: 'WixMadeforDisplayMedium',
    flex: 1,
    fontSize: 16,
    color: '#1F1F1F',
  },
  metricValue: {
    fontSize: 16,
    color: '#1F1F1F',
    fontWeight: '500',
  },

  adviceCard: {
    backgroundColor: '#F2F7FB',
    borderRadius: 20,
    paddingVertical: 25,
    paddingHorizontal: 20,
    marginBottom: 50,
  },

  adviceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  adviceLeftIconColumn: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  adviceTextColumn: {
    flex: 1,
  },

  adviceText: {
    fontFamily: 'WixMadeforDisplayMedium',
    fontSize: 14,
    lineHeight: 20,
    color: '#000',
  },

  adviceProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  lockSvg: {
    marginRight: 10,
  },

  progressBarBg: {
    flex: 1,
    height: 15,
    backgroundColor: '#D6DCE3',
    borderRadius: 999,
    overflow: 'hidden',
  },

  progressBarFill: {
    height: '100%',
    backgroundColor: '#9AA6B2',
    borderRadius: 999,
  },
  
  sectionTitle: {
    fontFamily: 'WixMadeforDisplayBold',
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 14,
  },

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 50,
  },
  summaryCard: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#F2F7FB',
    borderRadius: 20,
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 14,
    marginBottom: 16,
    justifyContent: 'space-between',
  },

  summaryTitle: {
    fontSize: 14,
    lineHeight: 18,
    color: '#262626',
    fontFamily: 'WixMadeforDisplayMedium',
  },

  summaryValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },

  summaryValue: {
    fontSize: 100,
    lineHeight: 100,
    fontFamily: 'AlumniSans',
    includeFontPadding: false,
    transform: [{ translateY: 22 }],
  },

  summarySuffix: {
    fontSize: 16,
    lineHeight: 16,
    color: '#222222',
    marginLeft: 10,
    marginBottom: 6,
    fontFamily: 'WixMadeforDisplaySemiBold',
  },

  chartCard: {
    backgroundColor: '#F2F7FB',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    marginBottom: 24,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  chartItem: {
    width: 35,
    alignItems: 'center',
  },
  barTrack: {
    height: 92,
    width: 40,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: 38,
    borderRadius: 20,
    backgroundColor: '#F83603',
  },
  chartDay: {
    fontFamily: 'WixMadeforDisplayMedium',
    marginTop: 10,
    fontSize: 13,
    color: '#333333',
    textAlign: 'center',
    width: 40,
  },
});