import React, { useState, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, KeyboardAvoidingView, Platform, Alert, TextInput
} from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
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

    // Refs for chaining
    const emailRef = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);
    const confirmPasswordRef = useRef<TextInput>(null);

    // Clear all fields every time the screen gains focus.
    // Prevents stale autofill state after navigating back from login.
    useFocusEffect(
        useCallback(() => {
            setName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setShowPassword(false);
            return () => {
                confirmPasswordRef.current?.blur();
            };
        }, [])
    );

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
        const { error } = await register(email.trim(), password, name.trim());
        if (error) Alert.alert('Error de registro', error);
    };

    return (
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.decorCircle1} />
                    <View style={styles.decorCircle2} />
                    <View style={styles.logoCircle}>
                        <Ionicons name="storefront" size={28} color="#fff" />
                    </View>
                    <Text style={styles.appName}>Marketplace</Text>
                    <Text style={styles.appNameSub}>ITSUR</Text>
                    <View style={styles.taglineRow}>
                        <Ionicons name="person-add-outline" size={14} color="rgba(255,255,255,0.55)" />
                        <Text style={styles.tagline}>Crea tu cuenta institucional</Text>
                    </View>
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
                        // iOS: name autofill
                        textContentType="name"
                        autoComplete="name"
                        leftIcon={<Ionicons name="person-outline" size={18} color={colors.textMuted} />}
                        returnKeyType="next"
                        onSubmitEditing={() => emailRef.current?.focus()}
                        blurOnSubmit={false}
                    />

                    <AppInput
                        ref={emailRef}
                        label="Correo Institucional"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="1234@alumnos.itsur.edu.mx"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        // iOS: email autofill
                        textContentType="emailAddress"
                        autoComplete="email"
                        autoCorrect={false}
                        spellCheck={false}
                        leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textMuted} />}
                        returnKeyType="next"
                        onSubmitEditing={() => passwordRef.current?.focus()}
                        blurOnSubmit={false}
                    />

                    <AppInput
                        ref={passwordRef}
                        label="Contraseña"
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Mínimo 6 caracteres"
                        secureTextEntry={!showPassword}
                        // iOS: "newPassword" lets iOS suggest a strong password
                        textContentType={showPassword ? 'none' : 'newPassword'}
                        autoComplete={showPassword ? 'off' : 'password-new'}
                        autoCorrect={false}
                        spellCheck={false}
                        leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
                        rightIcon={
                            <Ionicons
                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={18}
                                color={colors.textMuted}
                            />
                        }
                        onRightIconPress={() => setShowPassword(v => !v)}
                        returnKeyType="next"
                        onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                        blurOnSubmit={false}
                    />

                    <AppInput
                        ref={confirmPasswordRef}
                        label="Confirmar Contraseña"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Repite tu contraseña"
                        secureTextEntry={!showPassword}
                        // iOS: "newPassword" keeps consistent autofill for confirm field
                        textContentType={showPassword ? 'none' : 'newPassword'}
                        autoComplete={showPassword ? 'off' : 'password-new'}
                        autoCorrect={false}
                        spellCheck={false}
                        leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
                        returnKeyType="done"
                        onSubmitEditing={handleRegister}
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
        borderRadius: 28,
        alignItems: 'center',
        paddingVertical: 36,
        paddingHorizontal: 24,
        marginBottom: 24,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 10,
        overflow: 'hidden',
    },
    decorCircle1: {
        position: 'absolute',
        top: -30,
        right: -30,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    decorCircle2: {
        position: 'absolute',
        bottom: -20,
        left: -20,
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },
    logoCircle: {
        width: 64,
        height: 64,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    appName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -0.5,
        lineHeight: 28,
    },
    appNameSub: {
        fontSize: 13,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.55)',
        letterSpacing: 4,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    taglineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    tagline: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.55)',
        fontWeight: '500',
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
    registerBtn: { marginTop: 4 },
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
