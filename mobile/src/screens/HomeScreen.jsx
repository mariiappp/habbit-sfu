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
    Rect,
    Defs,
    LinearGradient,
    Stop,
} from 'react-native-svg';

export default function HomeScreen({ navigation }) {
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
                        icon="📝"
                        label="Задачи"
                        value={`${tasksDone}/${tasksTotal}`}
                        iconBg="#DFF8C8"
                        iconColor="#66C61C"
                    />
                    <MetricRow
                        icon="🔥"
                        label="Привычки"
                        value={`${habitsDone}/${habitsTotal}`}
                        iconBg="#FFE5D9"
                        iconColor="#FF7A45"
                    />
                    <MetricRow
                        icon="📱"
                        label="Экранное время"
                        value={`${screenTime}/${screenLimit} ч`}
                        iconBg="#E3E8FF"
                        iconColor="#7388FF"
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

                <AdviceCard
                    title="Совет дня"
                    text={dailyAdvice}
                    progress={adviceProgress}
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

function MetricRow({ icon, label, value, iconBg, iconColor, isLast = false }) {
    return (
        <View style={[styles.metricRow, isLast && styles.metricRowLast]}>
            <View style={[styles.metricIconWrapper, { backgroundColor: iconBg }]}>
                <Text style={[styles.metricIcon, { color: iconColor }]}>{icon}</Text>
            </View>
            <Text style={styles.metricLabel}>{label}</Text>
            <Text style={styles.metricValue}>{value}</Text>
        </View>
    );
}

function AdviceCard({ title, text, progress }) {
    return (
        <View style={styles.adviceCard}>
            <Text style={styles.adviceTitle}>{title}</Text>

            <View style={styles.adviceTextRow}>
                <Text style={styles.adviceEmoji}>📍</Text>
                <Text style={styles.adviceText}>{text}</Text>
            </View>

            <View style={styles.adviceProgressRow}>
                <Text style={styles.lockIcon}>🔒</Text>
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
            <Text style={styles.chartTitle}>Продуктивность</Text>

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
        fontSize: 20,
        fontWeight: '700',
        color: '#111111',
        marginBottom: 22,
        marginTop: 8,
    },

    progressWrapper: {
        alignItems: 'center',
        marginBottom: 22,
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
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    metricIcon: {
        fontSize: 13,
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
        borderRadius: 22,
        padding: 16,
        marginBottom: 22,
    },
    adviceTitle: {
        fontFamily: 'WixMadeforDisplayBold',
        fontSize: 17,
        fontWeight: '700',
        color: '#111111',
        marginBottom: 14,
    },
    adviceTextRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    adviceEmoji: {
        marginRight: 8,
        fontSize: 15,
    },
    adviceText: {
        fontFamily: 'WixMadeforDisplayMedium',
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
        color: '#4A4A4A',
    },
    adviceProgressRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    lockIcon: {
        fontSize: 14,
        marginRight: 10,
    },
    progressBarBg: {
        flex: 1,
        height: 10,
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
        marginBottom: 80,
    },
    summaryCard: {
        width: '48%',
        aspectRatio: 1,
        backgroundColor: '#F2F7FB',
        borderRadius: 22,
        paddingTop: 18,
        paddingHorizontal: 16,
        paddingBottom: 14,
        marginBottom: 14,
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
        marginTop: 10,
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
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 18,
        marginBottom: 24,
    },
    chartTitle: {
        fontFamily: 'WixMadeforDisplayBold',
        fontSize: 17,
        fontWeight: '700',
        color: '#111111',
        marginBottom: 18,
    },
    chartBars: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    chartItem: {
        width: 44,
        alignItems: 'center',
    },
    barTrack: {
        height: 92,
        width: 40,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    barFill: {
        width: 40,
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