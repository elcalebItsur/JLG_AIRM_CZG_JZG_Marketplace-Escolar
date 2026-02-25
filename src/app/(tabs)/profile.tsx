import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { Role } from '@/types/role';
import { getMyProducts } from '@/services/productService';
import { getSellerReviews } from '@/services/reviewService';
import { subscribeToNotifications } from '@/services/notificationService';

interface MenuItemProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
    tint?: string;
    badge?: string;
}

function MenuItem({ icon, label, onPress, tint = colors.primary, badge }: MenuItemProps) {
    return (
        <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.menuItemIcon, { backgroundColor: tint + '18' }]}>
                <Ionicons name={icon} size={20} color={tint} />
            </View>
            <Text style={styles.menuItemLabel}>{label}</Text>
            {badge && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                </View>
            )}
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
    );
}

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
    [Role.STUDENT]: { label: 'Estudiante', color: '#3182CE' },
    [Role.TEACHER]: { label: 'Docente', color: '#6B46C1' },
    [Role.ADMIN]: { label: 'Administrador', color: '#C05621' },
};

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const [productCount, setProductCount] = useState<number | null>(null);
    const [reviewCount, setReviewCount] = useState<number | null>(null);
    const [avgRating, setAvgRating] = useState<number | null>(null);
    const [unreadNotifs, setUnreadNotifs] = useState(0);

    useEffect(() => {
        if (!user) return;
        // Products count
        getMyProducts(user.id).then(prods => setProductCount(prods.length));
        // Reviews + avg rating
        getSellerReviews(user.id).then(reviews => {
            setReviewCount(reviews.length);
            if (reviews.length > 0) {
                const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
                setAvgRating(Math.round(avg * 10) / 10);
            } else {
                setAvgRating(null);
            }
        });
        // Unread notification count
        const unsub = subscribeToNotifications(user.id, (notifs) => {
            setUnreadNotifs(notifs.filter(n => !n.isRead).length);
        });
        return unsub;
    }, [user]);

    if (!user) return null;

    const role = ROLE_CONFIG[user.role] ?? { label: user.role, color: colors.primary };
    const initials = user.displayName
        .split(' ')
        .slice(0, 2)
        .map((w: string) => w[0]?.toUpperCase())
        .join('');

    const handleLogout = () => {
        Alert.alert('Cerrar Sesión', '¿Estás seguro que deseas salir?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Salir', style: 'destructive', onPress: logout },
        ]);
    };

    return (
        <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
            {/* Header banner */}
            <View style={styles.headerBanner}>
                {/* Avatar */}
                <View style={styles.avatarWrapper}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View style={[styles.roleBadge, { backgroundColor: role.color }]}>
                        <Text style={styles.roleBadgeText}>{role.label}</Text>
                    </View>
                </View>
                <Text style={styles.name}>{user.displayName}</Text>
                <Text style={styles.email}>{user.email}</Text>
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                        {productCount !== null ? productCount : '—'}
                    </Text>
                    <Text style={styles.statLabel}>Publicaciones</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                        {reviewCount !== null ? reviewCount : '—'}
                    </Text>
                    <Text style={styles.statLabel}>Reseñas</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <View style={styles.statRatingRow}>
                        {avgRating != null && (
                            <Ionicons name="star" size={16} color={colors.accent} />
                        )}
                        <Text style={styles.statValue}>
                            {avgRating != null ? avgRating.toFixed(1) : '—'}
                        </Text>
                    </View>
                    <Text style={styles.statLabel}>Valoración</Text>
                </View>
            </View>

            {/* Menu items */}
            <View style={styles.menuCard}>
                <Text style={styles.menuSection}>Mi Actividad</Text>
                <MenuItem
                    icon="cube-outline"
                    label="Mis Publicaciones"
                    onPress={() => router.push('/products/my-products')}
                />
                <MenuItem
                    icon="swap-horizontal-outline"
                    label="Mis Transacciones"
                    onPress={() => router.push('/transactions/history')}
                />
                {user.role === Role.ADMIN && (
                    <MenuItem
                        icon="shield-checkmark-outline"
                        label="Panel de Administrador"
                        tint={colors.warning}
                        onPress={() => router.push('/admin/dashboard')}
                        badge="Admin"
                    />
                )}
            </View>

            <View style={styles.menuCard}>
                <Text style={styles.menuSection}>Cuenta</Text>
                <MenuItem
                    icon="person-outline"
                    label="Editar Perfil"
                    onPress={() => { }}
                />
                <MenuItem
                    icon="notifications-outline"
                    label="Notificaciones"
                    onPress={() => router.push('/notifications')}
                    badge={unreadNotifs > 0 ? String(unreadNotifs) : undefined}
                />
                <MenuItem
                    icon="help-circle-outline"
                    label="Ayuda y Soporte"
                    onPress={() => { }}
                />
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
                <Ionicons name="log-out-outline" size={20} color={colors.error} />
                <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>

            <Text style={styles.versionText}>Marketplace ITSUR v1.0</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.background,
    },
    headerBanner: {
        backgroundColor: colors.primary,
        alignItems: 'center',
        paddingTop: 28,
        paddingBottom: 36,
        paddingHorizontal: 20,
    },
    avatarWrapper: {
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 1,
    },
    roleBadge: {
        marginTop: -12,
        paddingHorizontal: 12,
        paddingVertical: 3,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#fff',
    },
    roleBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
        textTransform: 'capitalize',
    },
    name: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    email: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        marginHorizontal: 16,
        marginTop: -20,
        borderRadius: 16,
        paddingVertical: 16,
        justifyContent: 'space-around',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 5,
        marginBottom: 16,
    },
    statItem: { alignItems: 'center' },
    statRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.text,
    },
    statLabel: {
        ...typography.presets.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        backgroundColor: colors.border,
    },
    menuCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        paddingTop: 4,
        paddingBottom: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    menuSection: {
        ...typography.presets.caption,
        color: colors.textMuted,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
        borderTopWidth: 0,
    },
    menuItemIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuItemLabel: {
        flex: 1,
        ...typography.presets.bodyMedium,
        color: colors.text,
    },
    badge: {
        backgroundColor: colors.accent,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.primaryDark,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 14,
        borderRadius: 14,
        backgroundColor: colors.errorLight,
        borderWidth: 1.5,
        borderColor: colors.error + '40',
    },
    logoutText: {
        ...typography.presets.bodyMedium,
        color: colors.error,
        fontWeight: '700',
    },
    versionText: {
        ...typography.presets.caption,
        color: colors.textMuted,
        textAlign: 'center',
        paddingBottom: 32,
    },
});
