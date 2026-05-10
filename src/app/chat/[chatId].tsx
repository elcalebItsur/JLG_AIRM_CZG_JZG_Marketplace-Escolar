import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList,
    TextInput, TouchableOpacity, KeyboardAvoidingView,
    Platform, ActivityIndicator, Image, LayoutAnimation,
    useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { useAuth } from '@/context/AuthContext';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { ChatMessage, Chat } from '@/types/chat';
import {
    subscribeToMessages,
    sendMessage,
    markChatAsRead,
} from '@/services/chatService';
import {
    getDoc,
    doc,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

/** Format a timestamp for display inside the chat */
function formatMsgTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

/** Group consecutive messages by sender */
function isSameSender(a?: ChatMessage, b?: ChatMessage) {
    return a?.senderId === b?.senderId;
}

/** Group messages by date */
function groupMessagesByDate(messages: ChatMessage[]) {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    messages.forEach(msg => {
        const date = new Date(msg.createdAt).toLocaleDateString('es-MX', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
        const lastGroup = groups[groups.length - 1];
        if (lastGroup && lastGroup.date === date) {
            lastGroup.messages.push(msg);
        } else {
            groups.push({ date, messages: [msg] });
        }
    });
    return groups;
}

export default function ChatRoomScreen() {
    const { chatId } = useLocalSearchParams<{ chatId: string }>();
    const { user } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width: screenWidth } = useWindowDimensions();

    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);

    const listRef = useRef<FlatList>(null);
    const inputRef = useRef<TextInput>(null);

    // Responsive max bubble width — wider on bigger screens
    const maxBubbleWidth = Math.min(screenWidth * 0.78, 440);

    // Load chat metadata once
    useEffect(() => {
        if (!chatId) return;
        getDoc(doc(db, 'chats', chatId)).then(snap => {
            if (snap.exists()) {
                const data = snap.data();
                setChat({ id: snap.id, ...data } as Chat);
            }
        });
    }, [chatId]);

    // Real-time message subscription
    useEffect(() => {
        if (!chatId) return;
        const unsub = subscribeToMessages(chatId, (msgs) => {
            if (Platform.OS !== 'web') {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            }
            setMessages(msgs);
            setLoading(false);
        });
        return unsub;
    }, [chatId]);

    // Mark as read when the chat room is open
    useEffect(() => {
        if (chatId) markChatAsRead(chatId).catch(() => { });
    }, [chatId]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [messages.length]);

    const handleSend = useCallback(async () => {
        if (!chatId || !user || !text.trim()) return;
        setSending(true);
        await sendMessage(chatId, user.id, user.displayName, text, user.photoURL);
        setText('');
        setSending(false);
        inputRef.current?.focus();
    }, [chatId, user, text]);

    const getOtherUserId = (): string => {
        if (!chat || !user) return '';
        return chat.participants.find(p => p !== user.id) ?? '';
    };

    const getOtherName = (): string => {
        if (!chat || !user) return 'Chat';
        const otherId = getOtherUserId();
        return chat.participantsMap[otherId] ?? 'Usuario';
    };

    const getOtherPhoto = (): string | null => {
        if (!chat || !user) return null;
        const otherId = getOtherUserId();
        return chat.participantsPhotosMap?.[otherId] || null;
    };

    // ─── Render a single bubble ──────────────────────────────────────────────
    const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
        const isMe = item.senderId === user?.id;
        const prevMsg = messages[index - 1];
        const nextMsg = messages[index + 1];
        const isFirstInGroup = !isSameSender(prevMsg, item);
        const isLastInGroup = !isSameSender(item, nextMsg);

        return (
            <View style={[
                styles.msgWrapper, 
                isMe ? styles.msgWrapperMe : styles.msgWrapperOther,
            ]}>
                {/* Avatar for others — left side */}
                {!isMe && (
                    <View style={styles.bubbleAvatarWrapper}>
                        {isLastInGroup ? (
                            <UserAvatar 
                                userId={item.senderId} 
                                userName={item.senderName} 
                                size={30} 
                                initialPhoto={item.senderPhoto || chat?.participantsPhotosMap?.[item.senderId]} 
                            />
                        ) : (
                            <View style={{ width: 30 }} />
                        )}
                    </View>
                )}

                <View style={{ maxWidth: maxBubbleWidth, flex: 1 }}>
                    {/* Sender name (only first msg in group & not me) */}
                    {!isMe && isFirstInGroup && (
                        <Text style={styles.msgSenderName}>{item.senderName}</Text>
                    )}

                    <View style={[
                        styles.bubble,
                        isMe ? styles.bubbleMe : styles.bubbleOther,
                        isFirstInGroup && (isMe ? styles.bubbleMeFirst : styles.bubbleOtherFirst),
                        isLastInGroup && (isMe ? styles.bubbleMeLast : styles.bubbleOtherLast),
                    ]}>
                        <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
                            {item.text}
                        </Text>
                        <View style={styles.bubbleFooter}>
                            <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
                                {formatMsgTime(item.createdAt)}
                            </Text>
                            {isMe && (
                                <Ionicons 
                                    name={item.isRead ? 'checkmark-done' : 'checkmark'} 
                                    size={14} 
                                    color={item.isRead ? '#81D4FA' : 'rgba(255,255,255,0.5)'} 
                                    style={{ marginLeft: 4 }}
                                />
                            )}
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    // ─── Build flat data from grouped messages ──────────────────────────────
    const flatData = React.useMemo(() => {
        const groups = groupMessagesByDate(messages);
        const flattened: (ChatMessage | { type: 'header'; date: string; id: string })[] = [];
        groups.forEach(g => {
            flattened.push({ type: 'header', date: g.date, id: `header-${g.date}` });
            flattened.push(...g.messages);
        });
        return flattened;
    }, [messages]);

    return (
        <>
            <Stack.Screen
                options={{
                    headerTitle: () => (
                        <TouchableOpacity 
                            style={styles.headerTitleRow}
                            activeOpacity={0.7}
                        >
                            <UserAvatar 
                                userId={getOtherUserId()} 
                                userName={getOtherName()} 
                                size={34} 
                                initialPhoto={getOtherPhoto()} 
                                style={{ borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' }}
                            />
                            <View>
                                <Text style={styles.headerName}>
                                    {getOtherName()}
                                </Text>
                                {chat && (
                                    <Text style={styles.headerProduct} numberOfLines={1}>
                                        📦 {chat.productTitle}
                                    </Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    ),
                    headerTintColor: colors.textOnDark,
                    headerRight: () => chat ? (
                        <TouchableOpacity 
                            style={styles.headerPricePill}
                            onPress={() => router.push(`/products/${chat.productId}`)}
                        >
                            <Text style={styles.headerPriceText}>
                                ${chat.productPrice.toFixed(2)}
                            </Text>
                            <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.7)" />
                        </TouchableOpacity>
                    ) : null,
                }}
            />

            <KeyboardAvoidingView
                style={styles.root}
                behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : Platform.OS === 'android' ? 56 : 60}
            >
                {/* Product info strip */}
                {chat && (
                    <TouchableOpacity 
                        style={styles.productStrip}
                        onPress={() => router.push(`/products/${chat.productId}`)}
                        activeOpacity={0.7}
                    >
                        {chat.productImage ? (
                            <Image 
                                source={{ uri: chat.productImage }} 
                                style={styles.productStripThumb} 
                            />
                        ) : (
                            <View style={[styles.productStripThumb, styles.productStripThumbFallback]}>
                                <Ionicons name="cube-outline" size={18} color={colors.textMuted} />
                            </View>
                        )}
                        <View style={{ flex: 1 }}>
                            <Text style={styles.productStripText} numberOfLines={1}>
                                {chat.productTitle}
                            </Text>
                            <Text style={styles.productStripPrice}>${chat.productPrice.toFixed(2)}</Text>
                        </View>
                        <View style={styles.viewProductBtn}>
                            <Text style={styles.viewProductText}>Ver producto</Text>
                            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                        </View>
                    </TouchableOpacity>
                )}

                {/* Message list */}
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator color={colors.primary} size="large" />
                        <Text style={styles.loadingText}>Cargando mensajes...</Text>
                    </View>
                ) : messages.length === 0 ? (
                    <View style={styles.center}>
                        <View style={styles.emptyIconWrap}>
                            <Ionicons name="chatbubble-ellipses-outline" size={52} color={colors.primary} />
                        </View>
                        <Text style={styles.emptyTitle}>¡Inicia la conversación!</Text>
                        <Text style={styles.emptyText}>
                            Envía un mensaje al vendedor sobre este producto 👋
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        ref={listRef}
                        data={flatData}
                        keyExtractor={m => m.id}
                        renderItem={({ item, index }) => {
                            if ('type' in item && item.type === 'header') {
                                return (
                                    <View style={styles.dateHeader}>
                                        <View style={styles.datePill}>
                                            <Text style={styles.dateHeaderText}>{item.date}</Text>
                                        </View>
                                    </View>
                                );
                            }
                            // Re-calculate context for the message item
                            const msgIndex = messages.findIndex(m => m.id === item.id);
                            return renderMessage({ item: item as ChatMessage, index: msgIndex });
                        }}
                        contentContainerStyle={[
                            styles.messageList, 
                            { paddingBottom: Platform.OS === 'android' ? 12 : 20 }
                        ]}
                        showsVerticalScrollIndicator={false}
                        onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
                    />
                )}

                {/* Input bar */}
                <View style={[
                    styles.inputBar, 
                    { paddingBottom: Math.max(insets.bottom, 12) }
                ]}>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            ref={inputRef}
                            style={styles.textInput}
                            value={text}
                            onChangeText={setText}
                            placeholder="Escribe un mensaje..."
                            placeholderTextColor={colors.textMuted}
                            multiline
                            maxLength={1000}
                            returnKeyType="send"
                            blurOnSubmit={false}
                            onSubmitEditing={handleSend}
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
                        onPress={handleSend}
                        disabled={!text.trim() || sending}
                        activeOpacity={0.7}
                    >
                        {sending
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Ionicons name="send" size={20} color="#fff" />
                        }
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.backgroundAlt },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingHorizontal: 40 },
    
    loadingText: { ...typography.presets.caption, color: colors.textMuted, marginTop: 4 },
    emptyIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primary + '12',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    emptyTitle: { 
        ...typography.presets.sectionTitle, 
        color: colors.text, 
        fontSize: 18,
    },
    emptyText: { 
        ...typography.presets.body, 
        color: colors.textMuted, 
        textAlign: 'center',
        lineHeight: 22,
    },

    // ─── Header ──────────────────────────────────────────────────────────
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    headerName: {
        fontWeight: '700',
        color: colors.textOnDark,
        fontSize: 16,
    },
    headerProduct: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        maxWidth: 180,
    },
    headerPricePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 4,
    },
    headerPriceText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },

    // ─── Product strip ───────────────────────────────────────────────────
    productStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        ...Platform.select({
            android: { elevation: 2 },
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
            },
        }),
        zIndex: 10,
    },
    productStripThumb: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: colors.backgroundAlt,
    },
    productStripThumbFallback: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    productStripText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
    },
    productStripPrice: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.primary,
        marginTop: 1,
    },
    viewProductBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.primary + '10',
    },
    viewProductText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.primary,
    },

    // ─── Date headers ─────────────────────────────────────────────────────
    dateHeader: {
        alignItems: 'center',
        marginVertical: 16,
    },
    datePill: {
        backgroundColor: colors.surface,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        ...Platform.select({
            android: { elevation: 1 },
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 3,
            },
        }),
    },
    dateHeaderText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textMuted,
        textTransform: 'capitalize',
    },

    // ─── Messages ─────────────────────────────────────────────────────────
    messageList: { 
        padding: 14,
        paddingBottom: 20, 
    },
    msgWrapper: { 
        marginVertical: 1.5,
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    msgWrapperMe: { 
        justifyContent: 'flex-end',
    },
    msgWrapperOther: { 
        justifyContent: 'flex-start',
    },

    msgSenderName: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textSecondary,
        marginBottom: 3,
        marginLeft: 4,
    },

    bubble: {
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 10,
        ...Platform.select({
            android: { elevation: 1 },
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 3,
            },
        }),
    },
    bubbleMe: {
        backgroundColor: colors.primary,
        borderBottomRightRadius: 6,
        marginLeft: 48,
    },
    bubbleMeFirst: { borderTopRightRadius: 20 },
    bubbleMeLast: { borderBottomRightRadius: 20 },
    bubbleOther: {
        backgroundColor: colors.surface,
        borderBottomLeftRadius: 6,
    },
    bubbleOtherFirst: { borderTopLeftRadius: 20 },
    bubbleOtherLast: { borderBottomLeftRadius: 20 },

    bubbleText: {
        fontSize: 15,
        color: colors.text,
        lineHeight: 22,
    },
    bubbleTextMe: { color: '#fff' },

    bubbleFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 4,
    },
    bubbleTime: {
        fontSize: 11,
        color: colors.textMuted,
    },
    bubbleTimeMe: { color: 'rgba(255,255,255,0.55)' },

    bubbleAvatarWrapper: {
        width: 30,
        marginRight: 8,
        justifyContent: 'flex-end',
    },

    // ─── Input bar ────────────────────────────────────────────────────────
    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
        paddingHorizontal: 12,
        paddingTop: 10,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    inputWrapper: {
        flex: 1,
        backgroundColor: colors.backgroundAlt,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: colors.border,
    },
    textInput: {
        paddingHorizontal: 18,
        paddingVertical: Platform.OS === 'android' ? 10 : 12,
        maxHeight: 120,
        fontSize: 15,
        color: colors.text,
        lineHeight: 22,
    },
    sendBtn: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Platform.OS === 'android' ? 2 : 0,
        ...Platform.select({
            android: { elevation: 3 },
            ios: {
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 8,
            },
        }),
    },
    sendBtnDisabled: { opacity: 0.35 },
});
