import React from 'react';
import { View, Text, StyleSheet, Button, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { Role } from '@/types/role';

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();

    if (!user) return null;

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{user.displayName.charAt(0)}</Text>
                    </View>
                    <Text style={styles.name}>{user.displayName}</Text>
                    <Text style={styles.email}>{user.email}</Text>
                    <View style={styles.roleContainer}>
                        <Text style={styles.role}>{user.role}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Cuenta</Text>
                    <Button title="Mis Publicaciones" color={colors.secondary} onPress={() => router.push('/products/my-products')} />
                    <View style={{ height: 10 }} />
                    {user.role === Role.ADMIN && (
                        <Button title="Panel de Administrador" color={colors.primary} onPress={() => router.push('/admin/dashboard')} />
                    )}
                </View>

                <View style={styles.footer}>
                    <Button title="Cerrar Sesión" color={colors.error} onPress={logout} />
                </View>
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarText: {
        fontSize: 32,
        color: colors.surface,
        fontWeight: 'bold',
    },
    name: {
        fontSize: typography.sizes.xl,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    email: {
        fontSize: typography.sizes.md,
        color: colors.textSecondary,
        marginBottom: 8,
    },
    roleContainer: {
        backgroundColor: '#333',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    role: {
        color: colors.surface,
        fontSize: typography.sizes.xs,
        fontWeight: 'bold',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: typography.sizes.lg,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 10,
    },
    footer: {
        marginTop: 'auto',
    }

});
