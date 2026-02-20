import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { colors } from '@/theme/colors';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Por favor ingresa correo y contraseña');
            return;
        }

        const { error } = await login(email, password);
        if (error) {
            Alert.alert('Error de Inicio de Sesión', error);
        } else {
            // Navigation is handled by the protected route layout, but we can force it too
            // router.replace('/'); 
        }
    };

    return (
        <ScreenWrapper style={styles.container}>
            <View style={styles.formContainer}>
                <Text style={styles.title}>Iniciar Sesión</Text>

                <Text style={styles.label}>Correo Institucional</Text>
                <TextInput
                    style={styles.input}
                    placeholder="ej. 1234@alumnos.itsur.edu.mx"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <Text style={styles.label}>Contraseña</Text>
                <TextInput
                    style={styles.input}
                    placeholder="******"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <View style={styles.buttonContainer}>
                    <Button
                        title={isLoading ? "Cargando..." : "Ingresar"}
                        color={colors.primary}
                        onPress={handleLogin}
                        disabled={isLoading}
                    />
                </View>

                <Link href="/register" asChild>
                    <TouchableOpacity>
                        <Text style={styles.linkText}>¿No tienes cuenta? <Text style={styles.linkBold}>Regístrate aquí</Text></Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        padding: 20,
    },
    formContainer: {
        backgroundColor: colors.surface,
        padding: 24,
        borderRadius: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 24,
        textAlign: 'center',
    },
    label: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
    },
    buttonContainer: {
        marginTop: 8,
        marginBottom: 16,
    },
    linkText: {
        textAlign: 'center',
        color: colors.textSecondary,
        fontSize: 14,
    },
    linkBold: {
        color: colors.primary,
        fontWeight: 'bold',
    },
});
