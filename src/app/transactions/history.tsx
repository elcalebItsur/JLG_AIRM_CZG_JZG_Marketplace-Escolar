/**
 * TransactionHistory — shows the current user's sales and purchases.
 * Accessible from Profile → "Mis Transacciones".
 */
import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList,
    ActivityIndicator, TouchableOpacity, Image,
} from 'react-native';
import { showAlert, showConfirm } from '@/utils/crossPlatformAlert';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { useAuth } from '@/context/AuthContext';
import { Transaction } from '@/types/transaction';
import {
    getSellerTransactions,
    getBuyerTransactions,
    updateTransactionStatus,
} from '@/services/transactionService';
import { createNotification } from '@/services/notificationService';

type Tab = 'sales' | 'purchases';


const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    pending: { label: 'Pendiente', color: '#B7791F', icon: 'time-outline' },
    completed: { label: 'Completada', color: '#276749', icon: 'checkmark-circle' },
    cancelled: { label: 'Cancelada', color: '#C53030', icon: 'close-circle-outline' },
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
}

export default function TransactionHistoryScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>('sales');
    const [sales, setSales] = useState<Transaction[]>([]);
    const [purchases, setPurchases] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        Promise.all([
            getSellerTransactions(user.id),
            getBuyerTransactions(user.id),
        ]).then(([s, p]) => {
            setSales(s);
            setPurchases(p);
            setLoading(false);
        });
    }, [user]);

    const data = activeTab === 'sales' ? sales : purchases;

    const handleConfirmReceipt = async (tx: Transaction) => {
        const confirmed = await showConfirm(
            'Confirmar recepción',
            '¿Confirmas que recibiste este producto correctamente?',
            'Confirmar'
        );
        
        if (!confirmed) return;

        setProcessingId(tx.id);
        const { success, error } = await updateTransactionStatus(tx.id, 'completed');
        
        if (success) {
            const now = new Date().toISOString();
            setPurchases(prev =>
                prev.map(p => p.id === tx.id ? { ...p, status: 'completed', completedAt: now } : p)
            );

            // Notify the seller (consistency with product detail)
            createNotification({
                userId: tx.sellerId,
                type: 'confirmed',
                title: 'Compra confirmada',
                body: `El comprador confirmó la recepción de "${tx.productTitle}".`,
                relatedId: tx.productId,
            });

            showAlert('¡Gracias!', 'Recepción confirmada. La transacción se ha completado.');
        } else {
            showAlert('Error', error ?? 'No se pudo confirmar');
        }
        setProcessingId(null);
    };

    const renderItem = ({ item }: { item: Transaction }) => {
        const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending;
        const isBuyer = activeTab === 'purchases';
        const canConfirm = isBuyer && item.status === 'pending';

        return (
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => router.push(`/products/${item.productId}`)}
            >
                {/* Header row */}
                <View style={styles.cardHeader}>
                    <View style={styles.cardIcon}>
                        {item.productImage ? (
                            <Image source={{ uri: item.productImage }} style={styles.productThumb} />
                        ) : (
                            <Ionicons
                                name={isBuyer ? 'bag-outline' : 'cube-outline'}
                                size={22}
                                color={colors.primary}
                            />
                        )}
                    </View>
                    <View style={styles.cardMeta}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{item.productTitle}</Text>
                        <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
                    </View>
                    <Text style={styles.cardPrice}>${item.price.toFixed(2)}</Text>
                </View>

                {/* Participants */}
                <View style={styles.participantRow}>
                    <Ionicons name="person-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.participantText}>
                        {isBuyer
                            ? `Vendedor: ${item.sellerName}`
                            : `Comprador: ${item.buyerName}`
                        }
                    </Text>
                </View>

                {/* Status + actions */}
                <View style={styles.cardFooter}>
                    <View style={[styles.statusBadge, { backgroundColor: cfg.color + '18' }]}>
                        <Ionicons name={cfg.icon as any} size={13} color={cfg.color} />
                        <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>

                    {/* Buyer can confirm receipt */}
                    {canConfirm && (
                        <TouchableOpacity
                            style={[styles.confirmBtn, processingId === item.id && { opacity: 0.7 }]}
                            onPress={(e) => {
                                e.stopPropagation?.();
                                handleConfirmReceipt(item);
                            }}
                            activeOpacity={0.8}
                            disabled={processingId === item.id}
                        >
                            {processingId === item.id ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Ionicons name="checkmark-done-outline" size={15} color="#fff" />
                            )}
                            <Text style={styles.confirmBtnText}>
                                {processingId === item.id ? 'Confirmando...' : 'Confirmar recepción'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {item.completedAt && (
                        <Text style={styles.completedAt}>
                            Completada {formatDate(item.completedAt)}
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.root}>

            {/* Tab selector */}
            <View style={styles.tabs}>
                {(['sales', 'purchases'] as Tab[]).map(t => (
                    <TouchableOpacity
                        key={t}
                        style={[styles.tab, activeTab === t && styles.tabActive]}
                        onPress={() => setActiveTab(t)}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name={t === 'sales' ? 'trending-up-outline' : 'bag-outline'}
                            size={16}
                            color={activeTab === t ? colors.primary : colors.textMuted}
                        />
                        <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
                            {t === 'sales' ? `Ventas (${sales.length})` : `Compras (${purchases.length})`}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : data.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons
                        name={activeTab === 'sales' ? 'trending-up-outline' : 'bag-outline'}
                        size={64}
                        color={colors.border}
                    />
                    <Text style={styles.emptyTitle}>
                        {activeTab === 'sales' ? 'Sin ventas registradas' : 'Sin compras registradas'}
                    </Text>
                    <Text style={styles.emptySub}>
                        {activeTab === 'sales'
                            ? 'Cuando marques un producto como vendido, aparecerá aquí'
                            : 'Las compras confirmadas por el vendedor aparecerán aquí'
                        }
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={data}
                    keyExtractor={tx => tx.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.background,
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 14,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    tabActive: { borderBottomColor: colors.primary },
    tabText: { ...typography.presets.bodyMedium, color: colors.textMuted },
    tabTextActive: { color: colors.primary, fontWeight: '700' },

    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        padding: 32,
        backgroundColor: colors.background,
    },
    emptyTitle: { ...typography.presets.sectionTitle, color: colors.text },
    emptySub: { ...typography.presets.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },

    list: { padding: 16, gap: 12 },

    card: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    cardIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.backgroundAlt,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    cardMeta: { flex: 1 },
    cardTitle: { ...typography.presets.bodyMedium, color: colors.text },
    cardDate: { ...typography.presets.caption, color: colors.textMuted, marginTop: 2 },
    cardPrice: { fontSize: 18, fontWeight: '800', color: colors.primary },
    productThumb: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },

    participantRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.backgroundAlt,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    participantText: { ...typography.presets.caption, color: colors.textSecondary },

    cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    statusText: { fontSize: 12, fontWeight: '700' },

    confirmBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: colors.success,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    confirmBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    completedAt: { ...typography.presets.caption, color: colors.textMuted },
});
