import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, KeyboardAvoidingView, Platform, TextInput
} from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

// Permite que el auth flow se complete al regresar a la app
WebBrowser.maybeCompleteAuthSession();

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const { login, loginWithGoogleWeb, loginWithGoogleNative, isLoading } = useAuth();

    const passwordRef = useRef<TextInput>(null);

    // Configurar Google Auth Request para nativo (iOS/Android)
    // Usa el proxy de Expo para obtener un redirect URI https:// que Google acepta
    // Para que funcione: ejecuta 'npx expo login' en la terminal
    const redirectUri = makeRedirectUri({
        // En Expo Go, esto genera: https://auth.expo.io/@{user}/{slug}
        // En producción, usarás el scheme nativo
    });

    // Log del redirect URI para depuración (cópialo a Google Cloud Console > Credenciales)
    useEffect(() => {
        if (Platform.OS !== 'web') {
            console.log('📱 Google Auth Redirect URI:', redirectUri);
        }
    }, [redirectUri]);

    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
        redirectUri: Platform.OS === 'web' ? undefined : redirectUri,
        selectAccount: true, // Forzar selector de cuentas
    });

    // Procesar la respuesta de Google en nativo
    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            handleNativeGoogleResult(id_token);
        } else if (response?.type === 'error') {
            setErrorMsg('Error al iniciar sesión con Google');
        }
    }, [response]);

    const handleNativeGoogleResult = async (idToken: string) => {
        setErrorMsg(null);
        const { error } = await loginWithGoogleNative(idToken);
        if (error) {
            setErrorMsg(error);
        }
    };

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
        const { error } = await login(email.trim(), password);
        if (error) {
            setErrorMsg(error);
        }
    };

    const handleGoogleLogin = async () => {
        setErrorMsg(null);
        if (Platform.OS === 'web') {
            // En web usamos signInWithPopup directamente
            const { error } = await loginWithGoogleWeb();
            if (error) {
                setErrorMsg(error);
            }
        } else {
            // En nativo usamos expo-auth-session
            if (!request) {
                setErrorMsg('Google Sign-In no está configurado. Agrega EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID a tu archivo .env');
                return;
            }
            promptAsync();
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
                    <View style={styles.decorCircle2} />

                    <View style={styles.logoCircle}>
                        <Ionicons name="storefront" size={32} color="#fff" />
                    </View>
                    <Text style={styles.appName}>Marketplace</Text>
                    <Text style={styles.appNameSub}>ITSUR</Text>
                    <View style={styles.taglineRow}>
                        <Ionicons name="school-outline" size={14} color="rgba(255,255,255,0.55)" />
                        <Text style={styles.tagline}>Compra y vende en tu comunidad</Text>
                    </View>
                </View>

                {/* Card form */}
                <View style={styles.form}>
                    <View style={styles.formHeader}>
                        <Text style={styles.formTitle}>Iniciar Sesión</Text>
                        <Text style={styles.formSubtitle}>Accede con tu cuenta institucional</Text>
                    </View>

                    {errorMsg && (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={18} color={colors.error} />
                            <Text style={styles.errorText}>{errorMsg}</Text>
                        </View>
                    )}

                    <AppInput
                        label="Correo Institucional"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="1234@alumnos.itsur.edu.mx"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        textContentType="emailAddress"
                        autoComplete="email"
                        leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textMuted} />}
                        returnKeyType="next"
                        onSubmitEditing={() => passwordRef.current?.focus()}
                        blurOnSubmit={false}
                        autoCorrect={false}
                        spellCheck={false}
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
                        spellCheck={false}
                    />

                    <AppButton
                        title="Ingresar"
                        onPress={handleLogin}
                        loading={isLoading}
                        style={styles.loginBtn}
                    />

                    <View style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>o</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Botón de Google Sign-In */}
                    <AppButton
                        title="Continuar con Google"
                        onPress={handleGoogleLogin}
                        loading={isLoading}
                        variant="ghost"
                        style={styles.googleBtn}
                        icon={<Ionicons name="logo-google" size={20} color={colors.primary} />}
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
                <View style={styles.footerRow}>
                    <Ionicons name="shield-checkmark-outline" size={13} color={colors.textMuted} />
                    <Text style={styles.footerNote}>
                        Solo para la comunidad ITSUR · @itsur.edu.mx
                    </Text>
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
        padding: 20,
        paddingBottom: 40,
    },

    /* ─── Header ──────────────────────────────────── */
    header: {
        backgroundColor: colors.primary,
        borderRadius: 28,
        alignItems: 'center',
        paddingVertical: 40,
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
        width: 72,
        height: 72,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },
    appName: {
        fontSize: 26,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -0.5,
        lineHeight: 30,
    },
    appNameSub: {
        fontSize: 14,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.55)',
        letterSpacing: 4,
        textTransform: 'uppercase',
        marginBottom: 10,
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

    /* ─── Form card ───────────────────────────────── */
    form: {
        backgroundColor: colors.surface,
        borderRadius: 22,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 4,
        marginBottom: 16,
    },
    formHeader: {
        marginBottom: 20,
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
        marginBottom: 16,
        gap: 8,
    },
    errorText: {
        ...typography.presets.caption,
        color: colors.error,
        flex: 1,
    },
    loginBtn: {
        marginTop: 6,
        marginBottom: 4,
    },
    googleBtn: {
        marginBottom: 14,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 14,
        gap: 12,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border,
    },
    dividerText: {
        ...typography.presets.caption,
        color: colors.textMuted,
        fontWeight: '600',
    },
    linkRow: {
        flexDirection: 'row',
        justifyContent: 'center',
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

    /* ─── Footer ──────────────────────────────────── */
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5,
    },
    footerNote: {
        ...typography.presets.caption,
        color: colors.textMuted,
        textAlign: 'center',
    },
});
