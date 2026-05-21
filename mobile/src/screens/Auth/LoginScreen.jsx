import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    ActivityIndicator,
} from 'react-native';
import LogoHabbit from "../../../assets/images/LogoHabbit.svg";
import API_BASE_URL from '../../api/config';


export default function LoginScreen({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLogin = async () => {
        if (isSubmitting) return;
        const trimmedUsername = username.trim();
        const trimmedPassword = password;

        if (!trimmedUsername || !trimmedPassword) {
            setErrorMessage('Введите логин и пароль.');
            return;
        }

        setIsSubmitting(true);
        setErrorMessage('');

        try {
            const response = await fetch(`${API_BASE_URL}/auth/moodle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: trimmedUsername,
                    password: trimmedPassword,
                    service: 'moodle_mobile_app',
                }),
            });

            let data = null;
            try {
                data = await response.json();
            } catch (error) {
                data = null;
            }

            if (!response.ok) {
                const serverMessage =
                    data?.detail?.error_description ||
                    data?.detail?.error ||
                    data?.error_description;
                throw new Error(serverMessage || 'Не удалось войти. Попробуйте снова.');
            }

            const token = data?.access_token;
            if (!token) {
                throw new Error('Moodle не вернул токен. Попробуйте снова.');
            }

            await onLoginSuccess(token);
        } catch (error) {
            setErrorMessage(error?.message || 'Не удалось войти. Попробуйте снова.');
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
                style={styles.wrapper}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.container}>
                    <View style={styles.formBlock}>
                        <View style={styles.logoContainer}>
                            <LogoHabbit width={180} height={60} />
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Имя пользователя"
                            placeholderTextColor="#BFBFBF"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Пароль"
                            placeholderTextColor="#BFBFBF"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        {!!errorMessage && (
                            <Text style={styles.errorText}>{errorMessage}</Text>
                        )}

                        <TouchableOpacity
                            style={[styles.button, isSubmitting && styles.buttonDisabled]}
                            onPress={handleLogin}
                            activeOpacity={0.9}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>Войти</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    formBlock: {
        width: '100%',
        alignItems: 'center',
        marginTop: -40,
    },
    logoContainer: {
        marginBottom: 34,
        alignItems: 'center',
    },
    input: {
        fontFamily: 'WixMadeforDisplayMedium',
        width: '100%',
        height: 56,
        backgroundColor: '#F2F7FB',
        borderRadius: 28,
        paddingHorizontal: 22,
        fontSize: 16,
        color: '#000000',
        marginBottom: 24,
    },
    errorText: {
        width: '100%',
        color: '#D32F2F',
        fontFamily: 'WixMadeforDisplayMedium',
        fontSize: 13,
        marginBottom: 12,
        textAlign: 'center',
    },
    button: {
        width: '100%',
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F83603',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        fontFamily: 'WixMadeforDisplaySemiBold',
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
});
