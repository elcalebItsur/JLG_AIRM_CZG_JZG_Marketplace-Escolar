/**
 * app/notifications.tsx — In-app notification feed for all users.
 */
import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList,
    TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { AppNotification, NotificationType } from '@/types/notification';
import {
    subscribeToNotifications,
    markNotificationRead,
    markAllNotificationsRead,
} from '@/services/notificationService';

const TYPE_CONFIG: Record<NotificationType, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
    message: { icon: 'chatbubble-outline', color: colors.primary },
    sold: { icon: 'cube-outline', color: colors.accent },
    confirmed: { icon: 'checkmark-circle-outline', color: colors.success },
    report_resolved: { icon: 'flag-outline', color: colors.warning },
    general: { icon: 'information-circle-outline', color: colors.textSecondary },
};

function formatTime(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60_000);
    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `Hace ${diffH}h`;
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}

export default function NotificationsScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [notifs, setNotifs] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const unsub = subscribeToNotifications(user.id, (data) => {
            setNotifs(data);
            setLoading(false);
        });
        return unsub;
    }, [user]);

    const handleTap = async (n: AppNotification) => {
        if (!n.isRead) await markNotificationRead(n.id);
        // Navigate to related content
        if (n.relatedId) {
            if (n.type === 'message') router.push(`/chat/${n.relatedId}`);
            else if (n.type === 'sold' || n.type === 'confirmed' || n.type === 'report_resolved') {
                router.push(`/products/${n.relatedId}`);
            }
        }
    };

    const renderItem = ({ item }: { item: AppNotification }) => {
        const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.general;
        return (
            <TouchableOpacity
                style={[styles.card, !item.isRead && styles.cardUnread]}
                onPress={() => handleTap(item)}
                activeOpacity={0.8}
            >
                <View style={[styles.iconWrap, { backgroundColor: cfg.color + '20' }]}>
                    <Ionicons name={cfg.icon} size={22} color={cfg.color} />
                </View>
                <View style={styles.textWrap}>
                    <Text style={[styles.title, !item.isRead && styles.titleUnread]} numberOfLines={1}>
                        {item.title}
                    </Text>
                    <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
                    <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
                </View>
                {!item.isRead && <View style={styles.unreadDot} />}
            </TouchableOpacity>
        );
    };

    const unreadCount = notifs.filter(n => !n.isRead).length;

    return (
        <View style={styles.root}>
            {/* Mark all read */}
            {unreadCount > 0 && (
                <TouchableOpacity
                    style={styles.markAllBtn}
                    onPress={() => user && markAllNotificationsRead(user.id)}
                    activeOpacity={0.8}
                >
                    <Ionicons name="checkmark-done-outline" size={16} color={colors.primary} />
                    <Text style={styles.markAllText}>Marcar todas como leídas ({unreadCount})</Text>
                </TouchableOpacity>
            )}

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : notifs.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="notifications-off-outline" size={64} color={colors.border} />
                    <Text style={styles.emptyTitle}>Sin notificaciones</Text>
                    <Text style={styles.emptySub}>Te avisaremos sobre tus compras, mensajes y más</Text>
                </View>
            ) : (
                <FlatList
                    data={notifs}
                    keyExtractor={n => n.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },

    markAllBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: colors.primary + '10',
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    markAllText: { ...typography.presets.caption, color: colors.primary, fontWeight: '600' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
    emptyTitle: { ...typography.presets.sectionTitle, color: colors.text },
    emptySub: { ...typography.presets.body, color: colors.textMuted, textAlign: 'center' },

    list: { paddingVertical: 8 },
    card: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingHorizontal: 16, paddingVertical: 14,
        backgroundColor: colors.surface,
    },
    cardUnread: { backgroundColor: colors.primary + '06' },

    iconWrap: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
    textWrap: { flex: 1, gap: 2 },
    title: { ...typography.presets.bodyMedium, color: colors.text },
    titleUnread: { fontWeight: '700' },
    body: { ...typography.presets.caption, color: colors.textMuted, lineHeight: 18 },
    time: { ...typography.presets.caption, color: colors.textMuted, fontSize: 11, marginTop: 2 },
    unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, flexShrink: 0 },
    separator: { height: 1, backgroundColor: colors.border },
});
