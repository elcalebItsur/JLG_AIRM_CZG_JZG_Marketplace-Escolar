import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList,
    TextInput, TouchableOpacity, KeyboardAvoidingView,
    Platform, ActivityIndicator, Image,
} from 'react-native';
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

export default function ChatRoomScreen() {
    const { chatId } = useLocalSearchParams<{ chatId: string }>();
    const { user } = useAuth();
    const router = useRouter();

    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);

    const listRef = useRef<FlatList>(null);
    const inputRef = useRef<TextInput>(null);

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

    const handleSend = async () => {
        if (!chatId || !user || !text.trim()) return;
        setSending(true);
        await sendMessage(chatId, user.id, user.displayName, text, user.photoURL);
        setText('');
        setSending(false);
        inputRef.current?.focus();
    };

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
            <View style={[styles.msgWrapper, isMe ? styles.msgWrapperMe : styles.msgWrapperOther]}>
                {/* Sender name (only first msg in group & not me) */}
                {!isMe && isFirstInGroup && (
                    <Text style={styles.msgSenderName}>{item.senderName}</Text>
                )}

                <View style={[
                    styles.bubble,
                    isMe ? styles.bubbleMe : styles.bubbleOther,
                    isFirstInGroup && (isMe ? styles.bubbleMeFirst : styles.bubbleOtherFirst),
                ]}>
                    <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
                        {item.text}
                    </Text>
                    <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
                        {formatMsgTime(item.createdAt)}
                        {isMe && (
                            <Text> {item.isRead ? '✓✓' : '✓'}</Text>
                        )}
                    </Text>
                </View>

                {/* Sender Avatar (only for others & last in group) */}
                {!isMe && (
                    <View style={styles.bubbleAvatarWrapper}>
                        {isLastInGroup ? (
                            <UserAvatar 
                                userId={item.senderId} 
                                userName={item.senderName} 
                                size={28} 
                                initialPhoto={item.senderPhoto || chat?.participantsPhotosMap?.[item.senderId]} 
                            />
                        ) : (
                            <View style={{ width: 28 }} />
                        )}
                    </View>
                )}
            </View>
        );
    };

    return (
        <>
            <Stack.Screen
                options={{
                    headerTitle: () => (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <UserAvatar 
                                userId={getOtherUserId()} 
                                userName={getOtherName()} 
                                size={32} 
                                initialPhoto={getOtherPhoto()} 
                                style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}
                            />
                            <Text style={{ fontWeight: '700', color: colors.textOnDark, fontSize: 17 }}>
                                {getOtherName()}
                            </Text>
                        </View>
                    ),
                    headerTintColor: colors.textOnDark,
                    headerTitleStyle: { fontWeight: '700' },
                    headerRight: () => chat ? (
                        <View style={styles.headerProductPill}>
                            <Text style={styles.headerProductText} numberOfLines={1}>
                                📦 ${chat.productPrice.toFixed(2)}
                            </Text>
                        </View>
                    ) : null,
                }}
            />

            <KeyboardAvoidingView
                style={styles.root}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : (Platform.OS === 'web' ? 60 : 0)}
            >
                {/* Product info strip */}
                {chat && (
                    <View style={styles.productStrip}>
                        <Ionicons name="cube-outline" size={16} color={colors.primary} />
                        <Text style={styles.productStripText} numberOfLines={1}>
                            {chat.productTitle} · ${chat.productPrice.toFixed(2)}
                        </Text>
                    </View>
                )}

                {/* Message list */}
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator color={colors.primary} />
                    </View>
                ) : messages.length === 0 ? (
                    <View style={styles.center}>
                        <Ionicons name="chatbubble-outline" size={48} color={colors.border} />
                        <Text style={styles.emptyText}>Inicia la conversación 👋</Text>
                    </View>
                ) : (
                    <FlatList
                        ref={listRef}
                        data={messages}
                        keyExtractor={m => m.id}
                        renderItem={renderMessage}
                        contentContainerStyle={styles.messageList}
                        showsVerticalScrollIndicator={false}
                        onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
                    />
                )}

                {/* Input bar */}
                <View style={styles.inputBar}>
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
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    emptyText: { ...typography.presets.body, color: colors.textMuted },
    backBtn: { padding: 4, marginLeft: -4 },

    headerProductPill: {
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginRight: 4,
    },
    headerProductText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        maxWidth: 120,
    },

    productStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.accentLight,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    productStripText: {
        ...typography.presets.label,
        color: colors.primary,
        flex: 1,
    },

    messageList: { padding: 12, paddingBottom: 8 },

    msgWrapper: { marginVertical: 2, maxWidth: '85%' },
    msgWrapperMe: { alignSelf: 'flex-end', alignItems: 'flex-end' },
    msgWrapperOther: { alignSelf: 'flex-start', alignItems: 'flex-start', flexDirection: 'row-reverse' },

    msgSenderName: {
        ...typography.presets.caption,
        color: colors.textSecondary,
        marginBottom: 3,
        marginLeft: 4,
    },

    bubble: {
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 9,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 1,
    },
    bubbleMe: {
        backgroundColor: colors.primary,
        borderBottomRightRadius: 4,
    },
    bubbleOther: {
        backgroundColor: colors.surface,
        borderBottomLeftRadius: 4,
    },
    bubbleMeFirst: { borderTopRightRadius: 18 },
    bubbleOtherFirst: { borderTopLeftRadius: 18 },

    bubbleText: {
        ...typography.presets.body,
        color: colors.text,
        lineHeight: 22,
    },
    bubbleTextMe: { color: '#fff' },

    bubbleTime: {
        ...typography.presets.caption,
        color: colors.textMuted,
        marginTop: 4,
        textAlign: 'right',
    },
    bubbleTimeMe: { color: 'rgba(255,255,255,0.65)' },

    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        paddingBottom: Platform.OS === 'ios' ? 28 : 12,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    textInput: {
        flex: 1,
        backgroundColor: colors.inputBg,
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: colors.border,
        paddingHorizontal: 16,
        paddingVertical: 10,
        maxHeight: 120,
        fontSize: 15,
        color: colors.text,
        lineHeight: 22,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 4,
    },
    sendBtnDisabled: { opacity: 0.4 },

    bubbleAvatarWrapper: {
        width: 28,
        marginRight: 8,
        justifyContent: 'flex-end',
    },
});
