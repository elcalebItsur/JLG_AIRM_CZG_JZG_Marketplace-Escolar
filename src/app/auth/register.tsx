import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { colors } from '@/theme/colors';
import { validateEmailDomainForRegistration } from '@/utils/validators';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const { register, isLoading } = useAuth();
    const router = useRouter();

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Todos los campos son obligatorios');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden');
            return;
        }

        // Pre-validate domain for immediate feedback
        const domainValidation = validateEmailDomainForRegistration(email);
        if (!domainValidation.ok) {
            Alert.alert('Dominio Inválido', domainValidation.message);
            return;
        }

        const { error } = await register(email, password, name);
        if (error) {
            Alert.alert('Error de Registro', error);
        }
    };

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Crear Cuenta</Text>

                    <Text style={styles.label}>Nombre Completo</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Juan Pérez"
                        value={name}
                        onChangeText={setName}
                    />

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

                    <Text style={styles.label}>Confirmar Contraseña</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="******"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                    />

                    <View style={styles.buttonContainer}>
                        <Button
                            title={isLoading ? "Registrando..." : "Registrarse"}
                            color={colors.primary}
                            onPress={handleRegister}
                            disabled={isLoading}
                        />
                    </View>

                    <Link href="/login" asChild>
                        <TouchableOpacity>
                            <Text style={styles.linkText}>¿Ya tienes cuenta? <Text style={styles.linkBold}>Inicia Sesión</Text></Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
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
