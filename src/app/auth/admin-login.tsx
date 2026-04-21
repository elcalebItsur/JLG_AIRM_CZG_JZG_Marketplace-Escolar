import React, { useState, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, KeyboardAvoidingView, Platform, TextInput
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { Ionicons } from '@expo/vector-icons';
import { loginAdmin } from '@/services/authService';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isLoadingLocal, setIsLoadingLocal] = useState(false);
    
    // We use context for state, but since we have a custom loginAdmin 
    // that bypasses student validation, we'll call it directly or through a modified context.
    // For simplicity, we'll use a direct call and then let the auth listener handle the rest.
    const router = useRouter();

    const passwordRef = useRef<TextInput>(null);

    useFocusEffect(
        useCallback(() => {
            setEmail('');
            setPassword('');
            setShowPassword(false);
            setErrorMsg(null);
            return () => {
                passwordRef.current?.blur();
            };
        }, [])
    );

    const handleLogin = async () => {
        if (!email || !password) return;
        setErrorMsg(null);
        setIsLoadingLocal(true);
        
        try {
            const { error } = await loginAdmin(email.trim(), password);
            if (error) {
                setErrorMsg(error);
            } else {
                // Auth listener in _layout will handle redirect to dashboard
                // but we can also force it if needed.
                router.replace('/admin/dashboard');
            }
        } catch (e) {
            setErrorMsg('Ocurrió un error inesperado');
        } finally {
            setIsLoadingLocal(false);
        }
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
                {/* Header block */}
                <View style={styles.header}>
                    <View style={styles.decorCircle1} />
                    <View style={styles.logoCircle}>
                        <Ionicons name="shield-half" size={32} color="#fff" />
                    </View>
                    <Text style={styles.appName}>Acceso Admin</Text>
                    <Text style={styles.appNameSub}>Panel de Control</Text>
                </View>

                {/* Card form */}
                <View style={styles.form}>
                    <View style={styles.formHeader}>
                        <Text style={styles.formTitle}>Iniciar Sesión</Text>
                        <Text style={styles.formSubtitle}>Solo personal autorizado</Text>
                    </View>

                    {errorMsg && (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={18} color={colors.error} />
                            <Text style={styles.errorText}>{errorMsg}</Text>
                        </View>
                    )}

                    <AppInput
                        label="Correo Electrónico"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="admin@ejemplo.com"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        textContentType="emailAddress"
                        autoComplete="email"
                        leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textMuted} />}
                        returnKeyType="next"
                        onSubmitEditing={() => passwordRef.current?.focus()}
                        blurOnSubmit={false}
                        autoCorrect={false}
                    />

                    <AppInput
                        ref={passwordRef}
                        label="Contraseña"
                        value={password}
                        onChangeText={setPassword}
                        placeholder="••••••••"
                        secureTextEntry={!showPassword}
                        textContentType={showPassword ? 'none' : 'password'}
                        autoComplete={showPassword ? 'off' : 'password'}
                        leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
                        rightIcon={
                            <Ionicons
                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={18}
                                color={colors.textMuted}
                            />
                        }
                        onRightIconPress={() => setShowPassword(v => !v)}
                        returnKeyType="done"
                        onSubmitEditing={handleLogin}
                        autoCorrect={false}
                    />

                    <AppButton
                        title="Entrar al Panel"
                        onPress={handleLogin}
                        loading={isLoadingLocal}
                        style={styles.loginBtn}
                        variant="primary"
                    />

                    <TouchableOpacity 
                        style={styles.backBtn}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backBtnText}>Volver al inicio</Text>
                    </TouchableOpacity>
                </View>
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
        padding: 24,
    },
    header: {
        backgroundColor: colors.warning, // Gold/Warning for admin
        borderRadius: 24,
        alignItems: 'center',
        paddingVertical: 32,
        marginBottom: 24,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: colors.warning,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    decorCircle1: {
        position: 'absolute',
        top: -20,
        right: -20,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    logoCircle: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    appName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    appNameSub: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    form: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    formHeader: {
        marginBottom: 24,
    },
    formTitle: {
        ...typography.presets.sectionTitle,
        color: colors.text,
        marginBottom: 4,
    },
    formSubtitle: {
        ...typography.presets.caption,
        color: colors.textMuted,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.errorLight,
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        gap: 8,
    },
    errorText: {
        ...typography.presets.caption,
        color: colors.error,
        flex: 1,
    },
    loginBtn: {
        marginTop: 8,
    },
    backBtn: {
        marginTop: 20,
        alignItems: 'center',
    },
    backBtnText: {
        ...typography.presets.bodyMedium,
        color: colors.textMuted,
        textDecorationLine: 'underline',
    },
});
