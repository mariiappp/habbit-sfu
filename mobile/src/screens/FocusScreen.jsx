import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Pressable,
    TextInput,
    SafeAreaView
} from 'react-native';
import Repeat from '../../assets/images/focusIcons/Repeat.svg';
import Settings from '../../assets/images/focusIcons/Settings.svg';

export default function FocusScreen({ navigation }) {
    const [durationMinutes, setDurationMinutes] = useState(25);
    const [secondsLeft, setSecondsLeft] = useState(durationMinutes * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const [tempMinutes, setTempMinutes] = useState(String(durationMinutes));
    const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
    const [selectedSound, setSelectedSound] = useState('Классический');

    const backgroundOptions = [
        '#FFFFFF',
        '#F7F3FF',
        '#F2F7FB',
        '#FFF4EE',
        '#EEF8F0',
    ];

    const soundOptions = [
        'Классический',
        'Колокольчик',
        'Лес',
        'Дождь',
        'Тишина',
    ];

    useEffect(() => {
        if (!isRunning) return;

        const interval = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setIsRunning(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isRunning]);

    const formattedTime = useMemo(() => {
        const mins = Math.floor(secondsLeft / 60);
        const secs = secondsLeft % 60;

        return {
            minutes: String(mins).padStart(2, '0'),
            seconds: String(secs).padStart(2, '0'),
        };
    }, [secondsLeft]);

    const handleStartPause = () => {
        if (secondsLeft === 0) {
            setSecondsLeft(durationMinutes * 60);
        }
        setIsRunning((prev) => !prev);
    };

    const handleReset = () => {
        setIsRunning(false);
        setSecondsLeft(durationMinutes * 60);
    };

    const openSettings = () => {
        setTempMinutes(String(durationMinutes));
        setShowSettings(true);
    };

    const saveSettings = () => {
        const parsed = parseInt(tempMinutes, 10);

        if (!Number.isNaN(parsed) && parsed > 0) {
            setDurationMinutes(parsed);
            setSecondsLeft(parsed * 60);
            setIsRunning(false);
        }

        setShowSettings(false);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={[styles.container, { backgroundColor }]}>
                <Text style={styles.title}>Фокус</Text>

                <View style={styles.timerBlock}>
                    <Text style={styles.timeText}>{formattedTime.minutes}</Text>
                    <Text style={styles.timeText}>{formattedTime.seconds}</Text>
                </View>

                <View style={styles.controlsRow}>
                    {!isRunning ? (
                        <>
                            <TouchableOpacity
                                style={styles.sideButton}
                                activeOpacity={0.85}
                                onPress={handleReset}
                            >
                                <Repeat style={styles.sideButtonIcon}></Repeat>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.playButton}
                                activeOpacity={0.85}
                                onPress={handleStartPause}
                            >
                                <Text style={styles.playButtonIcon}>▷</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.sideButton}
                                activeOpacity={0.85}
                                onPress={openSettings}
                            >
                                <Settings style={styles.sideButtonIcon}></Settings>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity
                            style={styles.playButton}
                            activeOpacity={0.85}
                            onPress={handleStartPause}
                        >
                            <View style={styles.pauseIcon}>
                                <View style={styles.pauseBar} />
                                <View style={styles.pauseBar} />
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

                <Modal
                    visible={showSettings}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowSettings(false)}
                >
                    <Pressable
                        style={styles.modalOverlay}
                        onPress={() => setShowSettings(false)}
                    >
                        <Pressable style={styles.modalCard} onPress={() => { }}>
                            <Text style={styles.modalTitle}>Настройки таймера</Text>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Время (минуты)</Text>
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    value={tempMinutes}
                                    onChangeText={setTempMinutes}
                                    placeholder="Например, 25"
                                    placeholderTextColor="#999999"
                                />
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Цвет фона</Text>
                                <View style={styles.colorRow}>
                                    {backgroundOptions.map((color) => {
                                        const selected = color === backgroundColor;

                                        return (
                                            <TouchableOpacity
                                                key={color}
                                                style={[
                                                    styles.colorOption,
                                                    { backgroundColor: color },
                                                    selected && styles.colorOptionSelected,
                                                ]}
                                                onPress={() => setBackgroundColor(color)}
                                                activeOpacity={0.85}
                                            />
                                        );
                                    })}
                                </View>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Звук</Text>
                                {soundOptions.map((sound) => {
                                    const selected = sound === selectedSound;

                                    return (
                                        <TouchableOpacity
                                            key={sound}
                                            style={[
                                                styles.soundOption,
                                                selected && styles.soundOptionSelected,
                                            ]}
                                            onPress={() => setSelectedSound(sound)}
                                            activeOpacity={0.85}
                                        >
                                            <Text
                                                style={[
                                                    styles.soundOptionText,
                                                    selected && styles.soundOptionTextSelected,
                                                ]}
                                            >
                                                {sound}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={saveSettings}
                                activeOpacity={0.9}
                            >
                                <Text style={styles.saveButtonText}>Сохранить</Text>
                            </TouchableOpacity>
                        </Pressable>
                    </Pressable>
                </Modal>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    container: {
        flex: 1,
        paddingHorizontal: 18,
        paddingTop: 18,
    },

    title: {
        fontFamily: 'WixMadeforDisplayBold',
        fontSize: 18,
        fontWeight: '700',
        color: '#111111',
    },

    timerBlock: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 60,
    },

    timeText: {
        fontSize: 210,
        lineHeight: 190,
        fontFamily: 'AlumniSans',
        includeFontPadding: false,
        marginVertical: -10,
    },
    controlsRow: {
        minHeight: 90,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 22,
        marginBottom: 30,
    },

    sideButton: {
        width: 45,
        height: 45,
        borderRadius: 22,
        backgroundColor: '#F2F7FB',
        justifyContent: 'center',
        alignItems: 'center',

        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 6,
    },

    playButton: {
        width: 62,
        height: 62,
        borderRadius: 31,
        backgroundColor: '#F83603',
        justifyContent: 'center',
        alignItems: 'center',

        shadowColor: '#F83603',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },

    playButtonIcon: {
        fontSize: 28,
        color: '#FFFFFF',
        marginLeft: 3,
        fontWeight: '700',
    },

    pauseIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    pauseBar: {
        width: 6,
        height: 22,
        borderRadius: 4,
        backgroundColor: '#FFFFFF',
        marginHorizontal: 3,
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.28)',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },

    modalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
    },

    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111111',
        marginBottom: 20,
    },

    section: {
        marginBottom: 20,
    },

    sectionTitle: {
        fontFamily: 'WixMadeforDisplayBold',
        fontSize: 16,
        fontWeight: '600',
        color: '#222222',
        marginBottom: 10,
    },

    input: {
        fontFamily: 'WixMadeforDisplayMedium',
        height: 52,
        borderRadius: 16,
        backgroundColor: '#F2F7FB',
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#111111',
    },

    colorRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },

    colorOption: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 2,
        borderColor: '#E4E4E4',
    },

    colorOptionSelected: {
        borderColor: '#F83603',
    },

    soundOption: {
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        backgroundColor: '#F7F7F7',
        marginBottom: 10,
    },

    soundOptionSelected: {
        backgroundColor: '#FFF0EB',
        borderWidth: 1,
        borderColor: '#F83603',
    },

    soundOptionText: {
        fontFamily: 'WixMadeforDisplayMedium',
        fontSize: 15,
        color: '#222222',
    },

    soundOptionTextSelected: {
        color: '#F83603',
        fontWeight: '600',
    },

    saveButton: {
        marginTop: 4,
        height: 54,
        borderRadius: 18,
        backgroundColor: '#F83603',
        justifyContent: 'center',
        alignItems: 'center',
    },

    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },
});