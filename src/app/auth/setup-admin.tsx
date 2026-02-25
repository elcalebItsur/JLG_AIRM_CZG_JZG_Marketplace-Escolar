/**
 * TEMPORARY SCREEN — setup-admin.tsx
 * Use this once to create your admin account, then delete this file.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { registerAdmin } from '@/services/authService';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

export default function SetupAdminScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('Administrador');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleCreate = async () => {
        if (!email || !password || !name) {
            Alert.alert('Error', 'Completa todos los campos');
            return;
        }

        setLoading(true);
        const { error } = await registerAdmin(email, password, name);
        setLoading(false);

        if (error) {
            Alert.alert('Error', error);
        } else {
            Alert.alert('¡Éxito!', 'Usuario Administrador creado correctamente. Ya puedes iniciar sesión.', [
                { text: 'Ir al Login', onPress: () => router.replace('/auth/login') }
            ]);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Configuración de Admin</Text>
            <Text style={styles.subtitle}>Crea una cuenta de administrador (Solo uso inicial)</Text>

            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    placeholder="Nombre Completo"
                    value={name}
                    onChangeText={setName}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Correo Electrónico"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Contraseña"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleCreate}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Crear Admin</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
                    <Text style={styles.backLinkText}>Volver</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: 30, justifyContent: 'center' },
    title: { ...typography.presets.sectionTitle, textAlign: 'center', marginBottom: 10 },
    subtitle: { ...typography.presets.caption, textAlign: 'center', marginBottom: 30, color: colors.textMuted },
    form: { gap: 15 },
    input: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 10,
        padding: 15,
        fontSize: 16,
    },
    button: {
        backgroundColor: colors.warning,
        padding: 18,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    backLink: { marginTop: 15, alignItems: 'center' },
    backLinkText: { color: colors.textMuted, textDecorationLine: 'underline' },
});
