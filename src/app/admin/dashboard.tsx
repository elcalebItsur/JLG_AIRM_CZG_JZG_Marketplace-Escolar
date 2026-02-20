import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { colors } from '@/theme/colors';
import { Role } from '@/types/role';

export default function AdminDashboard() {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user || user.role !== Role.ADMIN) {
            Alert.alert('Acceso Denegado', 'No tienes permisos de administrador.');
            router.back();
        }
    }, [user]);

    if (!user || user.role !== Role.ADMIN) return null;

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <Text style={styles.title}>Panel de Administrador</Text>
                <Text style={styles.subtitle}>Gestión del Sistema</Text>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Usuarios</Text>
                    <Text>Total: 125</Text>
                    <Button title="Gestionar Usuarios" onPress={() => { }} color={colors.primary} />
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Publicaciones</Text>
                    <Text>Activas: 45</Text>
                    <Text>Pendientes: 3</Text>
                    <Button title="Revisar Publicaciones" onPress={() => { }} color={colors.primary} />
                </View>

                <Button title="Volver" onPress={() => router.back()} color={colors.textSecondary} />
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        color: colors.textSecondary,
        marginBottom: 24,
        textAlign: 'center',
    },
    card: {
        backgroundColor: colors.surface,
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    }
});
