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
import { makeRedirectUri, Prompt } from 'expo-auth-session';

// Permite que el auth flow se complete al regresar a la app
WebBrowser.maybeCompleteAuthSession();

export default function Login() {
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const { login, loginWithGoogleWeb, loginWithGoogleNative, isLoading } = useAuth();


    // Configurar Google Auth Request para nativo (iOS/Android)
    // 1. Configuración de URIs
    // En Expo Go necesitamos el Proxy. En producción (build), usamos el esquema nativo.
    const redirectUri = makeRedirectUri({
        scheme: 'marketplace-itsur',
        // preferUniversalRuntime: true // Ayuda con el proxy en algunos casos
    });

    const [request, response, promptAsync] = Google.useAuthRequest({
        // IMPORTANTE: Estos IDs deben ser DISTINTOS en tu .env
        clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
        // Al usar 'makeRedirectUri' sin parámetros forzados, Expo decidirá si usar Proxy o no
        redirectUri,
        // Forzar selector de cuentas
        prompt: Prompt.SelectAccount,
    });

    // Procesar la respuesta de Google
    useEffect(() => {
        if (response) {
            console.log('📱 Google Response Details:', JSON.stringify(response, null, 2));

            if (response.type === 'success') {
                const { id_token } = response.params;
                const idToken = id_token || response.authentication?.idToken;
                
                if (idToken) {
                    handleNativeGoogleResult(idToken);
                } else {
                    console.log('⚠️ No se encontró id_token en la respuesta');
                    setErrorMsg('Error al obtener token de Google');
                }
            } else if (response.type === 'error' || response.type === 'cancel' || response.type === 'dismiss') {
                console.log('❌ Auth Falló o Canceló:', response.type);
                // Si es un error 401 deleted_client, es un tema de configuración en Google Console
            }
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
            setErrorMsg(null);
            return () => {
                // Cleanup
            };
        }, [])
    );


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


                    {/* El login tradicional ha sido removido a petición */}
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                        <Text style={styles.infoText}>
                            Usa tu cuenta institucional de Google para acceder al Marketplace.
                        </Text>
                    </View>

                    {/* Botón de Google Sign-In como opción principal */}
                    <AppButton
                        title="Continuar con Google"
                        onPress={handleGoogleLogin}
                        loading={isLoading}
                        variant="primary" // Cambiado a primary para ser el foco
                        style={styles.googleBtn}
                        icon={<Ionicons name="logo-google" size={20} color="#fff" />}
                    />

                    <View style={styles.linkRow}>
                        <Link href="/auth/admin-login" asChild>
                            <TouchableOpacity>
                                <Text style={styles.linkAction}>Soy admin</Text>
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
    googleBtn: {
        marginBottom: 14,
    },
    linkRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
    },
    linkAction: {
        ...typography.presets.bodyMedium,
        color: colors.textMuted,
        textDecorationLine: 'underline',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.infoLight, // Changed for better contrast
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        gap: 10,
    },
    infoText: {
        ...typography.presets.caption,
        color: colors.info, // Changed for better contrast
        flex: 1,
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
