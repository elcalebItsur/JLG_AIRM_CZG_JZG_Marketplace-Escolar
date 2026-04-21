import React, { useState, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, KeyboardAvoidingView, Platform, Alert, TextInput
} from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { validateEmailDomainForRegistration } from '@/utils/validators';
import { Ionicons } from '@expo/vector-icons';

export default function Register() {
    const { isLoading } = useAuth();
    const router = useRouter();


    // Clear all fields every time the screen gains focus.
    // Prevents stale autofill state after navigating back from login.
    useFocusEffect(
        useCallback(() => {
            return () => {
                // Cleanup
            };
        }, [])
    );


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
                    {/* El registro tradicional ha sido removido */}
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                        <Text style={styles.infoText}>
                            Para registrarte, solo necesitas usar tu cuenta institucional de Google. Es rápido y seguro.
                        </Text>
                    </View>

                    {/* Botón de Registro con Google */}
                    <AppButton
                        title="Registrarse con Google"
                        onPress={() => router.replace('/auth/login')} // Redirigimos al login que tiene el flow de Google
                        variant="primary"
                        style={styles.registerBtn}
                        icon={<Ionicons name="logo-google" size={20} color="#fff" />}
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
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primaryLight,
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        gap: 10,
    },
    infoText: {
        ...typography.presets.caption,
        color: colors.primary,
        flex: 1,
    },
    footerNote: {
        ...typography.presets.caption,
        color: colors.textMuted,
        textAlign: 'center',
    },
});
