import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { Ionicons } from '@expo/vector-icons';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, isLoading } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) return;
        const { error } = await login(email, password);
        if (error) {
            // We use a simple inline error approach
            console.warn(error);
        }
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
                {/* Header gradient block */}
                <View style={styles.header}>
                    <View style={styles.logoCircle}>
                        <Text style={styles.logoEmoji}>🎓</Text>
                    </View>
                    <Text style={styles.appName}>Marketplace ITSUR</Text>
                    <Text style={styles.tagline}>Compra y vende en tu comunidad</Text>
                </View>

                {/* Card form */}
                <View style={styles.form}>
                    <Text style={styles.formTitle}>Iniciar Sesión</Text>

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
                        placeholder="••••••••"
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

                    <AppButton
                        title="Ingresar"
                        onPress={handleLogin}
                        loading={isLoading}
                        style={styles.loginBtn}
                    />

                    <View style={styles.linkRow}>
                        <Text style={styles.linkText}>¿No tienes cuenta? </Text>
                        <Link href="/auth/register" asChild>
                            <TouchableOpacity>
                                <Text style={styles.linkAction}>Regístrate aquí</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </View>

                {/* Footer note */}
                <Text style={styles.footerNote}>
                    Solo para la comunidad ITSUR · @itsur.edu.mx
                </Text>
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
        paddingVertical: 36,
        paddingHorizontal: 24,
        marginBottom: 24,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    logoCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    logoEmoji: {
        fontSize: 36,
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
        marginBottom: 20,
    },
    loginBtn: {
        marginTop: 4,
        marginBottom: 4,
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
