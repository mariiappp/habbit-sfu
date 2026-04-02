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
} from 'react-native';
import LogoHabbit from "../../../assets/images/LogoHabbit.svg";


export default function LoginScreen({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = () => {
        onLogin();
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

                        <TouchableOpacity style={styles.button} onPress={handleLogin} activeOpacity={0.9}>
                            <Text style={styles.buttonText}>Войти</Text>
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
    button: {
        width: '100%',
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F83603',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
    },
    buttonText: {
        fontFamily: 'WixMadeforDisplaySemiBold',
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
});