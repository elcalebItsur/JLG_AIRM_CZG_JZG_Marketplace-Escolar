import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { validateEmailDomainForRegistration } from '@/utils/validators';
import { Ionicons } from '@expo/vector-icons';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { register, isLoading } = useAuth();

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Campos requeridos', 'Por favor completa todos los campos');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden');
            return;
        }
        const domainValidation = validateEmailDomainForRegistration(email);
        if (!domainValidation.ok) {
            Alert.alert('Dominio inválido', domainValidation.message);
            return;
        }
        const { error } = await register(email, password, name);
        if (error) Alert.alert('Error de registro', error);
    };

    return (
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoCircle}>
                        <Text style={styles.logoEmoji}>🎓</Text>
                    </View>
                    <Text style={styles.appName}>Marketplace ITSUR</Text>
                    <Text style={styles.tagline}>Crea tu cuenta institucional</Text>
                </View>

                {/* Form card */}
                <View style={styles.form}>
                    <Text style={styles.formTitle}>Crear Cuenta</Text>

                    {/* Domain notice */}
                    <View style={styles.domainNotice}>
                        <Ionicons name="shield-checkmark-outline" size={16} color={colors.success} />
                        <Text style={styles.domainNoticeText}>
                            Solo correos @alumnos.itsur.edu.mx o @itsur.edu.mx
                        </Text>
                    </View>

                    <AppInput
                        label="Nombre Completo"
                        value={name}
                        onChangeText={setName}
                        placeholder="Juan Pérez García"
                        leftIcon={<Ionicons name="person-outline" size={18} color={colors.textMuted} />}
                    />

                    <AppInput
                        label="Correo Institucional"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="1234@alumnos.itsur.edu.mx"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textMuted} />}
                    />

                    <AppInput
                        label="Contraseña"
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Mínimo 6 caracteres"
                        secureTextEntry={!showPassword}
                        leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
                        rightIcon={
                            <Ionicons
                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={18}
                                color={colors.textMuted}
                            />
                        }
                        onRightIconPress={() => setShowPassword(v => !v)}
                    />

                    <AppInput
                        label="Confirmar Contraseña"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Repite tu contraseña"
                        secureTextEntry={!showPassword}
                        leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
                    />

                    <AppButton
                        title="Crear Cuenta"
                        onPress={handleRegister}
                        loading={isLoading}
                        style={styles.registerBtn}
                    />

                    <View style={styles.linkRow}>
                        <Text style={styles.linkText}>¿Ya tienes cuenta? </Text>
                        <Link href="/auth/login" asChild>
                            <TouchableOpacity>
                                <Text style={styles.linkAction}>Inicia Sesión</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>

                <Text style={styles.footerNote}>Solo para la comunidad ITSUR</Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        backgroundColor: colors.primary,
        borderRadius: 24,
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 24,
        marginBottom: 24,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    logoCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    logoEmoji: {
        fontSize: 30,
    },
    appName: {
        ...typography.presets.screenTitle,
        color: '#fff',
        marginBottom: 4,
    },
    tagline: {
        ...typography.presets.body,
        color: 'rgba(255,255,255,0.7)',
    },
    form: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
        marginBottom: 16,
    },
    formTitle: {
        ...typography.presets.sectionTitle,
        color: colors.text,
        marginBottom: 12,
    },
    domainNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.successLight,
        borderRadius: 10,
        padding: 10,
        marginBottom: 20,
    },
    domainNoticeText: {
        flex: 1,
        ...typography.presets.caption,
        color: colors.success,
        fontWeight: '500',
    },
    registerBtn: {
        marginTop: 4,
    },
    linkRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
    },
    linkText: {
        ...typography.presets.body,
        color: colors.textSecondary,
    },
    linkAction: {
        ...typography.presets.bodyMedium,
        color: colors.primary,
        fontWeight: '700',
    },
    footerNote: {
        ...typography.presets.caption,
        color: colors.textMuted,
        textAlign: 'center',
    },
});
