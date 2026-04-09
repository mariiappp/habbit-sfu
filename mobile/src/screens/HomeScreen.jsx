import React, { useMemo, useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
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

export default function HomeScreen() {
    const [userName] = useState('Иван');

    const [tasksDone, setTasksDone] = useState(5);
    const [tasksTotal] = useState(8);

    const [habitsDone, setHabitsDone] = useState(3);
    const [habitsTotal] = useState(5);

    const [screenTime, setScreenTime] = useState(3);
    const [screenLimit] = useState(4);

    const [weeklyStats] = useState({
        missedDeadlines: 3,
        completedTasks: 25,
        averageBalance: 78,
        averageScreenTime: 3.5,
    });

    const [productivityData] = useState([
        { day: 'Пн', value: 22 },
        { day: 'Вт', value: 28 },
        { day: 'Ср', value: 56 },
        { day: 'Чт', value: 70 },
        { day: 'Пт', value: 78 },
        { day: 'Сб', value: 42 },
        { day: 'Вс', value: 24 },
    ]);

    const adviceList = [
        'Я заметил, что ты выполняешь задачи лучше утром. Попробуй начать день с самой сложной!',
        'Сегодня хорошее время, чтобы закрыть хотя бы одну важную задачу.',
        'Сделай короткую фокус-сессию на 25 минут — это поможет войти в ритм.',
        'Не стремись сделать всё сразу. Начни с одной маленькой задачи.',
    ];

    const dailyAdvice = useMemo(() => {
        const index =
            (tasksDone + habitsDone + Math.floor(screenTime)) % adviceList.length;
        return adviceList[index];
    }, [tasksDone, habitsDone, screenTime]);

    const tasksProgress = tasksDone / tasksTotal;
    const habitsProgress = habitsDone / habitsTotal;
    const screenTimeScore = Math.max(0, 1 - screenTime / screenLimit);

    const balance = Math.round(
        ((tasksProgress + habitsProgress + screenTimeScore) / 3) * 100
    );

    const adviceProgress = Math.min(100, Math.round((balance / 100) * 85));

    const increaseTasks = () => {
        if (tasksDone < tasksTotal) setTasksDone((prev) => prev + 1);
    };

    const decreaseTasks = () => {
        if (tasksDone > 0) setTasksDone((prev) => prev - 1);
    };

    const increaseHabits = () => {
        if (habitsDone < habitsTotal) setHabitsDone((prev) => prev + 1);
    };

    const decreaseHabits = () => {
        if (habitsDone > 0) setHabitsDone((prev) => prev - 1);
    };

    const increaseScreenTime = () => {
        setScreenTime((prev) => +(prev + 0.5).toFixed(1));
    };

    const decreaseScreenTime = () => {
        if (screenTime > 0) setScreenTime((prev) => +(prev - 0.5).toFixed(1));
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.greeting}>Добрый день, {userName}!</Text>

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

                <View style={styles.controlsCard}>
                    <Text style={styles.controlsTitle}>Тест управления метриками</Text>

                    <ControlRow
                        title="Задачи"
                        onMinus={decreaseTasks}
                        onPlus={increaseTasks}
                    />
                    <ControlRow
                        title="Привычки"
                        onMinus={decreaseHabits}
                        onPlus={increaseHabits}
                    />
                    <ControlRow
                        title="Экранное время"
                        onMinus={decreaseScreenTime}
                        onPlus={increaseScreenTime}
                    />
                </View>

                <Text style={styles.sectionTitle}>Совет дня</Text>

                <AdviceCard text={dailyAdvice} progress={adviceProgress} />

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


function AdviceCard({ text, progress }) {
    return (
        <View style={styles.adviceCard}>
            <View style={styles.adviceTextRow}>
                <AdviceStar width={35} height={35} style={styles.adviceIcon} />
                <Text style={styles.adviceText}>{text}</Text>
            </View>

            <View style={styles.adviceProgressRow}>
                <Lock width={20} height={20} style={styles.lockSvg} />
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
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
    const maxValue = Math.max(...data.map((item) => item.value));

    return (
        <View style={styles.chartCard}>
            <View style={styles.chartBars}>
                {data.map((item) => {
                    const barHeight = Math.max(24, (item.value / maxValue) * 88);

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
        marginBottom: 50,
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
        marginBottom: 18,
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

    controlsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 18,
    },
    controlsTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111111',
        marginBottom: 14,
    },
    controlRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    controlLabel: {
        flex: 1,
        fontSize: 15,
        color: '#333333',
    },
    controlButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    controlButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#F83603',
        alignItems: 'center',
        justifyContent: 'center',
    },
    controlButtonText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
        lineHeight: 22,
    },

    adviceCard: {
        backgroundColor: '#F2F7FB',
        borderRadius: 20,
        paddingVertical: 25,
        paddingHorizontal: 20,
        marginBottom: 50,
    },
    adviceTextRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    adviceIcon: {
        marginRight: 5,
        marginTop: 2,
    },
    adviceText: {
        fontFamily: 'WixMadeforDisplayMedium',
        flex: 1,
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