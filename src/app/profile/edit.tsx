import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, KeyboardAvoidingView, Platform,
    Image, ActivityIndicator, TextInput,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { useAuth } from '@/context/AuthContext';
import { updateUserProfile } from '@/services/userService';
import { showAlert } from '@/utils/crossPlatformAlert';

const MAJORS = [
    'Ingeniería en Sistemas',
    'Ingeniería Industrial',
    'Ingeniería Electrónica',
    'Ingeniería Mecatrónica',
    'Licenciatura en Administración',
    'Gastronomía',
    'Otra'
];

export default function EditProfileScreen() {
    const { user } = useAuth();
    const router = useRouter();

    const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [major, setMajor] = useState(user?.major || '');
    const [saving, setSaving] = useState(false);

    if (!user) return null;

    const initials = user.displayName
        .split(' ')
        .slice(0, 2)
        .map((w: string) => w[0]?.toUpperCase())
        .join('');

    const handleSave = async () => {
        // Validation
        if (phoneNumber && !/^\d{10}$/.test(phoneNumber)) {
            showAlert('Teléfono inválido', 'Por favor ingresa un número de 10 dígitos');
            return;
        }

        setSaving(true);
        try {
            const { success, error } = await updateUserProfile(user.id, {
                phoneNumber,
                bio,
                major: major || undefined,
            });

            if (success) {
                showAlert('Perfil actualizado', 'Tus cambios se han guardado correctamente.', () => {
                    router.back();
                });
            } else {
                showAlert('Error', error || 'No se pudo actualizar el perfil');
            }
        } catch (e) {
            showAlert('Error', 'Ocurrió un error inesperado');
        } finally {
            setSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            <Stack.Screen options={{ 
                title: 'Editar Perfil',
                headerShadowVisible: false,
                headerStyle: { backgroundColor: colors.background }
            }} />
            
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Header / Avatar */}
                <View style={styles.header}>
                    <View style={styles.avatarWrap}>
                        {user.photoURL ? (
                            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                        ) : (
                            <Text style={styles.avatarText}>{initials}</Text>
                        )}
                        <View style={styles.lockIcon}>
                            <Ionicons name="lock-closed" size={12} color="#fff" />
                        </View>
                    </View>
                    <Text style={styles.infoTitle}>{user.displayName}</Text>
                    <Text style={styles.infoSubtitle}>{user.email}</Text>
                    <View style={styles.readOnlyBadge}>
                        <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
                        <Text style={styles.readOnlyText}>Nombre y foto no editables</Text>
                    </View>
                </View>

                {/* Form Sections */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información de Contacto</Text>
                    <AppInput
                        label="Número de Teléfono"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        placeholder="10 dígitos (ej. 4661234567)"
                        keyboardType="phone-pad"
                        maxLength={10}
                        leftIcon={<Ionicons name="call-outline" size={18} color={colors.textMuted} />}
                        helperText="Aparecerá en tus publicaciones para facilitar el contacto"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Acerca de ti</Text>
                    <AppInput
                        label="Carrera / Especialidad"
                        value={major}
                        onChangeText={setMajor}
                        placeholder="Selecciona o escribe tu carrera"
                        leftIcon={<Ionicons name="school-outline" size={18} color={colors.textMuted} />}
                    />
                    
                    <View style={styles.majorChips}>
                        {MAJORS.map(m => (
                            <TouchableOpacity 
                                key={m} 
                                style={[styles.chip, major === m && styles.chipActive]}
                                onPress={() => setMajor(m)}
                            >
                                <Text style={[styles.chipText, major === m && styles.chipTextActive]}>{m}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <AppInput
                        label="Biografía / Descripción"
                        value={bio}
                        onChangeText={setBio}
                        placeholder="Cuéntanos un poco sobre ti o lo que vendes..."
                        multiline
                        numberOfLines={4}
                        style={styles.bioInput}
                        helperText="Se mostrará en tu perfil público"
                    />
                </View>

                <AppButton
                    title="Guardar Cambios"
                    onPress={handleSave}
                    loading={saving}
                    style={styles.saveBtn}
                    icon={<Ionicons name="checkmark-circle-outline" size={20} color="#fff" />}
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: 20, paddingBottom: 40 },
    
    header: { alignItems: 'center', marginBottom: 32 },
    avatarWrap: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: colors.border,
        position: 'relative',
    },
    avatar: { width: '100%', height: '100%', borderRadius: 50 },
    avatarText: { fontSize: 36, fontWeight: '800', color: colors.primary },
    lockIcon: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        backgroundColor: colors.textMuted,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.background,
    },
    
    infoTitle: { ...typography.presets.h3, color: colors.text, marginBottom: 4 },
    infoSubtitle: { ...typography.presets.body, color: colors.textSecondary, marginBottom: 12 },
    readOnlyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.surfaceAlt,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    readOnlyText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },

    section: { marginBottom: 24 },
    sectionTitle: { 
        ...typography.presets.sectionTitle, 
        color: colors.text, 
        marginBottom: 16,
        letterSpacing: 0.5 
    },

    bioInput: { minHeight: 100, textAlignVertical: 'top', paddingTop: 12 },
    
    majorChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: -8, marginBottom: 20 },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: colors.surfaceAlt,
        borderWidth: 1,
        borderColor: colors.border,
    },
    chipActive: {
        backgroundColor: colors.primary + '15',
        borderColor: colors.primary,
    },
    chipText: { fontSize: 12, color: colors.textSecondary },
    chipTextActive: { color: colors.primary, fontWeight: '700' },

    saveBtn: { marginTop: 12 },
});
