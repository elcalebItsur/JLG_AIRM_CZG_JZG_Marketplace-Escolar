/**
 * admin/dashboard.tsx — Full admin dashboard with live Firestore stats.
 * Only accessible to users with role === 'admin'.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { Role } from '@/types/role';
import { getAdminStats, AdminStats } from '@/services/adminService';

interface StatCardProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: number | string;
    tint?: string;
    onPress?: () => void;
}

function StatCard({ icon, label, value, tint = colors.primary, onPress }: StatCardProps) {
    const Wrapper = onPress ? TouchableOpacity : View;
    return (
        <Wrapper style={[styles.statCard, { borderLeftColor: tint }]} onPress={onPress} activeOpacity={0.8}>
            <View style={[styles.statIcon, { backgroundColor: tint + '20' }]}>
                <Ionicons name={icon} size={24} color={tint} />
            </View>
            <View style={styles.statInfo}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
            </View>
            {onPress && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
        </Wrapper>
    );
}

export default function AdminDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadStats = useCallback(async () => {
        const s = await getAdminStats();
        setStats(s);
    }, []);

    useEffect(() => {
        if (!user || user.role !== Role.ADMIN) {
            router.back();
            return;
        }
        loadStats().finally(() => setLoading(false));
    }, [user]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadStats();
        setRefreshing(false);
    };

    if (!user || user.role !== Role.ADMIN) return null;

    return (
        <ScrollView
            style={styles.root}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={[styles.headerIcon, { backgroundColor: colors.warning + '20' }]}>
                    <Ionicons name="shield-checkmark" size={32} color={colors.warning} />
                </View>
                <Text style={styles.headerTitle}>Panel de Administrador</Text>
                <Text style={styles.headerSub}>Bienvenido, {user.displayName}</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : (
                <>
                    {/* Stats Grid */}
                    <Text style={styles.sectionTitle}>Estadísticas del Sistema</Text>

                    <StatCard
                        icon="people-outline"
                        label="Usuarios registrados"
                        value={stats?.totalUsers ?? 0}
                        tint={colors.primary}
                    />
                    <StatCard
                        icon="cube-outline"
                        label="Productos activos"
                        value={stats?.activeProducts ?? 0}
                        tint={colors.success}
                    />
                    <StatCard
                        icon="flag-outline"
                        label="Reportes pendientes"
                        value={stats?.pendingReports ?? 0}
                        tint={stats?.pendingReports ? colors.error : colors.textMuted}
                        onPress={() => router.push('/admin/reports')}
                    />
                    <StatCard
                        icon="swap-horizontal-outline"
                        label="Transacciones totales"
                        value={stats?.totalTransactions ?? 0}
                        tint={colors.accent}
                    />
                    <StatCard
                        icon="checkmark-circle-outline"
                        label="Transacciones completadas"
                        value={stats?.completedTransactions ?? 0}
                        tint={colors.success}
                    />

                    {/* Quick actions */}
                    <Text style={styles.sectionTitle}>Acciones Rápidas</Text>

                    <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => router.push('/admin/reports')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="flag" size={20} color="#fff" />
                        <Text style={styles.actionBtnText}>Gestionar Reportes</Text>
                        {(stats?.pendingReports ?? 0) > 0 && (
                            <View style={styles.actionBadge}>
                                <Text style={styles.actionBadgeText}>{stats!.pendingReports}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 40 },

    header: { alignItems: 'center', marginBottom: 28 },
    headerIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    headerTitle: { ...typography.presets.sectionTitle, color: colors.text, fontSize: 22 },
    headerSub: { ...typography.presets.caption, color: colors.textMuted, marginTop: 2 },

    sectionTitle: { ...typography.presets.bodyMedium, color: colors.textSecondary, marginTop: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 },

    statCard: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        backgroundColor: colors.surface,
        borderRadius: 14, padding: 16, marginBottom: 10,
        borderLeftWidth: 4,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
    },
    statIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    statInfo: { flex: 1 },
    statValue: { ...typography.presets.sectionTitle, color: colors.text, fontSize: 24 },
    statLabel: { ...typography.presets.caption, color: colors.textMuted, marginTop: 2 },

    actionBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: colors.primary, borderRadius: 14, padding: 16, marginBottom: 10,
    },
    actionBtnText: { ...typography.presets.bodyMedium, color: '#fff', flex: 1 },
    actionBadge: {
        backgroundColor: colors.error, borderRadius: 12,
        minWidth: 24, height: 24, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6,
    },
    actionBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
