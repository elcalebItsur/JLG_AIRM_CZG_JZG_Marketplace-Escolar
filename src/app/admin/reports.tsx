/**
 * admin/reports.tsx — Admin report management screen.
 * Lists all pending reports with dismiss / delete-product actions.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList,
    TouchableOpacity, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { Role } from '@/types/role';
import { Report, ReportStatus, REPORT_REASON_LABELS } from '@/types/report';
import { getReports, updateReportStatus, adminDeleteProduct } from '@/services/reportService';
import { createNotification } from '@/services/notificationService';

type FilterTab = 'pending' | 'all';

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_COLORS: Record<ReportStatus, string> = {
    pending: '#B7791F',
    reviewed: '#276749',
    dismissed: colors.textMuted,
};

export default function AdminReportsScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [reports, setReports] = useState<Report[]>([]);
    const [filter, setFilter] = useState<FilterTab>('pending');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [acting, setActing] = useState<string | null>(null); // reportId being actioned

    const loadReports = useCallback(async () => {
        const status: ReportStatus | undefined = filter === 'pending' ? 'pending' : undefined;
        const data = await getReports(status);
        setReports(data);
    }, [filter]);

    useEffect(() => {
        if (!user || user.role !== Role.ADMIN) { router.back(); return; }
        setLoading(true);
        loadReports().finally(() => setLoading(false));
    }, [user, filter]);

    const onRefresh = async () => { setRefreshing(true); await loadReports(); setRefreshing(false); };

    const handleDismiss = (report: Report) => {
        Alert.alert('Descartar reporte', '¿Confirmas que este reporte no requiere acción?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Descartar', style: 'destructive',
                onPress: async () => {
                    setActing(report.id);
                    const { success } = await updateReportStatus(report.id, 'dismissed');
                    if (success) {
                        // Notify reporter
                        createNotification({
                            userId: report.reporterId,
                            type: 'report_resolved',
                            title: 'Reporte revisado',
                            body: `Tu reporte sobre "${report.targetTitle}" fue revisado y descartado.`,
                            relatedId: report.targetId,
                        });
                        await loadReports();
                    }
                    setActing(null);
                },
            },
        ]);
    };

    const handleDeleteProduct = (report: Report) => {
        if (report.targetType !== 'product') return;
        Alert.alert('Eliminar publicación', `¿Confirmas eliminar "${report.targetTitle}"? Esta acción no se puede deshacer.`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar', style: 'destructive',
                onPress: async () => {
                    setActing(report.id);
                    await adminDeleteProduct(report.targetId);
                    await updateReportStatus(report.id, 'reviewed');
                    createNotification({
                        userId: report.reporterId,
                        type: 'report_resolved',
                        title: 'Reporte resuelto',
                        body: `La publicación "${report.targetTitle}" fue retirada por un administrador.`,
                    });
                    await loadReports();
                    setActing(null);
                },
            },
        ]);
    };

    const renderItem = ({ item }: { item: Report }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={[styles.typeBadge, { backgroundColor: item.targetType === 'product' ? colors.primary + '20' : colors.accent + '20' }]}>
                    <Ionicons
                        name={item.targetType === 'product' ? 'cube-outline' : 'person-outline'}
                        size={14}
                        color={item.targetType === 'product' ? colors.primary : colors.accent}
                    />
                    <Text style={[styles.typeBadgeText, { color: item.targetType === 'product' ? colors.primary : colors.accent }]}>
                        {item.targetType === 'product' ? 'Producto' : 'Usuario'}
                    </Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] }]} />
                <Text style={[styles.statusLabel, { color: STATUS_COLORS[item.status] }]}>
                    {item.status === 'pending' ? 'Pendiente' : item.status === 'reviewed' ? 'Revisado' : 'Descartado'}
                </Text>
            </View>

            <Text style={styles.targetTitle} numberOfLines={1}>📌 {item.targetTitle}</Text>
            <Text style={styles.reason}>Motivo: {REPORT_REASON_LABELS[item.reason]}</Text>
            {item.details ? <Text style={styles.details} numberOfLines={2}>"{item.details}"</Text> : null}

            <View style={styles.metaRow}>
                <Ionicons name="person-circle-outline" size={14} color={colors.textMuted} />
                <Text style={styles.metaText}>{item.reporterName}</Text>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
            </View>

            {item.status === 'pending' && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.dismissBtn]}
                        onPress={() => handleDismiss(item)}
                        disabled={acting === item.id}
                        activeOpacity={0.8}
                    >
                        {acting === item.id ? <ActivityIndicator size="small" color={colors.textMuted} /> : <>
                            <Ionicons name="close-circle-outline" size={16} color={colors.textMuted} />
                            <Text style={styles.dismissBtnText}>Descartar</Text>
                        </>}
                    </TouchableOpacity>
                    {item.targetType === 'product' && (
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.deleteBtn]}
                            onPress={() => handleDeleteProduct(item)}
                            disabled={acting === item.id}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="trash-outline" size={16} color="#fff" />
                            <Text style={styles.deleteBtnText}>Eliminar Producto</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );

    if (!user || user.role !== Role.ADMIN) return null;

    return (
        <View style={styles.root}>
            {/* Filter tabs */}
            <View style={styles.tabs}>
                {(['pending', 'all'] as FilterTab[]).map(t => (
                    <TouchableOpacity
                        key={t}
                        style={[styles.tab, filter === t && styles.tabActive]}
                        onPress={() => setFilter(t)}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.tabText, filter === t && styles.tabTextActive]}>
                            {t === 'pending' ? 'Pendientes' : 'Todos'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : reports.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="checkmark-circle-outline" size={64} color={colors.border} />
                    <Text style={styles.emptyTitle}>Sin reportes pendientes</Text>
                    <Text style={styles.emptySub}>¡Todo está limpio por ahora!</Text>
                </View>
            ) : (
                <FlatList
                    data={reports}
                    keyExtractor={r => r.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    tabs: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
    tabActive: { borderBottomColor: colors.primary },
    tabText: { ...typography.presets.bodyMedium, color: colors.textMuted },
    tabTextActive: { color: colors.primary, fontWeight: '700' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
    emptyTitle: { ...typography.presets.sectionTitle, color: colors.text },
    emptySub: { ...typography.presets.body, color: colors.textMuted },
    list: { padding: 16, gap: 12 },

    card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    typeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
    typeBadgeText: { ...typography.presets.caption, fontWeight: '600' },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 'auto' },
    statusLabel: { ...typography.presets.caption, fontWeight: '600' },

    targetTitle: { ...typography.presets.bodyMedium, color: colors.text },
    reason: { ...typography.presets.caption, color: colors.textSecondary },
    details: { ...typography.presets.caption, color: colors.textMuted, fontStyle: 'italic' },

    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    metaText: { ...typography.presets.caption, color: colors.textMuted },
    metaDot: { ...typography.presets.caption, color: colors.textMuted },

    actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
    dismissBtn: { backgroundColor: colors.backgroundAlt, borderWidth: 1, borderColor: colors.border },
    dismissBtnText: { ...typography.presets.caption, color: colors.textMuted, fontWeight: '600' },
    deleteBtn: { backgroundColor: colors.error },
    deleteBtnText: { ...typography.presets.caption, color: '#fff', fontWeight: '600' },
});
