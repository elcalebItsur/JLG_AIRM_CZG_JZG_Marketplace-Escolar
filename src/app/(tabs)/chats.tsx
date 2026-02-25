import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList,
    TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { useAuth } from '@/context/AuthContext';
import { Chat } from '@/types/chat';
import { subscribeToChats, markChatAsRead } from '@/services/chatService';

function formatTime(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
    if (diffDays === 0) return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return d.toLocaleDateString('es-MX', { weekday: 'short' });
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}

export default function ChatsScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [chats, setChats] = useState<Chat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        const unsub = subscribeToChats(user.id, (data) => {
            setChats(data);
            setLoading(false);
        });
        return unsub;
    }, [user]);

    // Mark chat as read and navigate to it
    const openChat = async (chat: Chat) => {
        if (chat.unreadCount > 0) {
            markChatAsRead(chat.id).catch(() => { });
        }
        router.push(`/chat/${chat.id}`);
    };

    const getOtherName = (chat: Chat): string => {
        if (!user) return '';
        const otherId = chat.participants.find(p => p !== user.id) ?? '';
        return chat.participantsMap[otherId] ?? 'Usuario';
    };

    const getAvatarLetter = (name: string) => name.charAt(0).toUpperCase();

    const renderItem = ({ item }: { item: Chat }) => {
        const otherName = getOtherName(item);
        // Only show unread badge when WE are the recipient (not the sender)
        const hasUnread = item.unreadCount > 0 && item.lastSenderId !== user?.id;

        return (
            <TouchableOpacity
                style={styles.chatRow}
                onPress={() => openChat(item)}
                activeOpacity={0.7}
            >
                {/* Avatar */}
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getAvatarLetter(otherName)}</Text>
                </View>

                {/* Content */}
                <View style={styles.chatContent}>
                    <View style={styles.chatHeader}>
                        <Text style={[styles.chatName, hasUnread && styles.chatNameBold]} numberOfLines={1}>
                            {otherName}
                        </Text>
                        <Text style={styles.chatTime}>{formatTime(item.lastMessageAt)}</Text>
                    </View>

                    <Text style={styles.chatProductTitle} numberOfLines={1}>
                        📦 {item.productTitle} · ${item.productPrice.toFixed(2)}
                    </Text>

                    <View style={styles.lastMsgRow}>
                        <Text
                            style={[styles.lastMsg, hasUnread && styles.lastMsgBold]}
                            numberOfLines={1}
                        >
                            {item.lastMessage || 'Inicia la conversación...'}
                        </Text>
                        {hasUnread && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                    {item.unreadCount > 9 ? '9+' : item.unreadCount}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (chats.length === 0) {
        return (
            <View style={styles.center}>
                <Ionicons name="chatbubbles-outline" size={64} color={colors.border} />
                <Text style={styles.emptyTitle}>Sin conversaciones</Text>
                <Text style={styles.emptySub}>
                    Cuando contactes a un vendedor, el chat aparecerá aquí
                </Text>
            </View>
        );
    }

    return (
        <FlatList
            data={chats}
            keyExtractor={c => c.id}
            renderItem={renderItem}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
    );
}

const styles = StyleSheet.create({
    list: { flex: 1, backgroundColor: colors.background },
    listContent: { paddingVertical: 8 },
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

    chatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: colors.surface,
        gap: 14,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    avatarText: { fontSize: 22, fontWeight: '700', color: '#fff' },
    chatContent: { flex: 1, gap: 2 },
    chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    chatName: { ...typography.presets.bodyMedium, color: colors.text, flex: 1, marginRight: 8 },
    chatNameBold: { fontWeight: '700' },
    chatTime: { ...typography.presets.caption, color: colors.textMuted },
    chatProductTitle: { ...typography.presets.caption, color: colors.textSecondary },
    lastMsgRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    lastMsg: { ...typography.presets.caption, color: colors.textMuted, flex: 1 },
    lastMsgBold: { fontWeight: '700', color: colors.text },
    badge: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        minWidth: 22,
        height: 22,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    separator: { height: 1, backgroundColor: colors.border, marginLeft: 82 },
});
