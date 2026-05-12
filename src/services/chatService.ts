/**
 * chatService.ts — Real-time chat using Firestore onSnapshot listeners.
 * Chat ID format: `{sortedUid1}_{sortedUid2}` — one chat per user PAIR,
 * regardless of how many products they discuss.
 */
import {
    collection,
    doc,
    addDoc,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    increment,
    arrayUnion,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Chat, ChatMessage } from '@/types/chat';
import { createNotification } from './notificationService';
import { logger } from '@/utils/logger';

const CHATS = 'chats';
const MESSAGES = 'messages';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a Firestore Timestamp or string to ISO string */
function toISO(value: unknown): string {
    if (!value) return new Date().toISOString();
    if (value instanceof Timestamp) return value.toDate().toISOString();
    if (typeof value === 'string') return value;
    return new Date().toISOString();
}

/** Generate a deterministic chat ID from the two user IDs (sorted so order doesn't matter) */
export function buildChatId(userIdA: string, userIdB: string): string {
    return [userIdA, userIdB].sort().join('_');
}

// ─── Get or create a chat ─────────────────────────────────────────────────────

export interface GetOrCreateChatParams {
    buyerId: string;
    buyerName: string;
    sellerId: string;
    sellerName: string;
    productId: string;
    productTitle: string;
    productImage?: string;
    productPrice: number;
    buyerPhoto?: string | null;
    sellerPhoto?: string | null;
}

/**
 * Returns an existing chat or creates a new one.
 * Uses a deterministic document ID based only on the two user IDs,
 * so there is at most ONE chat per user pair (regardless of product).
 * When a new product is discussed, the productId/title are updated on the chat.
 */
export async function getOrCreateChat(params: GetOrCreateChatParams): Promise<{ chatId: string; isNew: boolean; error?: string }> {
    const chatId = buildChatId(params.buyerId, params.sellerId);
    const ref = doc(db, CHATS, chatId);

    try {
        // Try to read the existing chat first
        let exists = false;
        try {
            const snap = await getDoc(ref);
            exists = snap.exists();

            if (exists) {
                // Chat exists — update the product context so the header reflects
                const update: Record<string, unknown> = {
                    productId: params.productId,
                    productTitle: params.productTitle,
                    productPrice: params.productPrice,
                    discussedProductIds: arrayUnion(params.productId),
                };
                if (params.productImage !== undefined) update.productImage = params.productImage;
                
                // Always sync photos when a chat is "opened" from product detail
                update[`participantsPhotosMap.${params.buyerId}`] = params.buyerPhoto || null;
                update[`participantsPhotosMap.${params.sellerId}`] = params.sellerPhoto || null;
                
                await updateDoc(ref, update);
                return { chatId, isNew: false };
            }
        } catch (readErr: any) {
            // If we get permission-denied on read, the document likely doesn't exist yet.
            // Firestore rules that check participants can't verify a non-existent doc.
            // We'll fall through to create the chat below.
            if (readErr?.code !== 'permission-denied') {
                throw readErr; // Re-throw non-permission errors
            }
            logger.info('Chat does not exist yet, creating new one...');
        }

        // Document doesn't exist (or was denied on read) — create brand-new chat
        const raw: Record<string, unknown> = {
            productId: params.productId,
            productTitle: params.productTitle,
            productPrice: params.productPrice,
            discussedProductIds: [params.productId],
            participants: [params.buyerId, params.sellerId],
            participantsMap: {
                [params.buyerId]: params.buyerName,
                [params.sellerId]: params.sellerName,
            },
            participantsPhotosMap: {
                [params.buyerId]: params.buyerPhoto || null,
                [params.sellerId]: params.sellerPhoto || null,
            },
            buyerId: params.buyerId,
            sellerId: params.sellerId,
            lastMessage: '',
            lastMessageAt: serverTimestamp(),
            unreadCount: 0,
        };
        if (params.productImage !== undefined) raw.productImage = params.productImage;
        await setDoc(ref, raw);
        return { chatId, isNew: true };

    } catch (err: any) {
        logger.error('getOrCreateChat error:', err?.code, err?.message, err);
        return { chatId: '', isNew: false, error: 'No se pudo abrir el chat' };
    }
}

// ─── Send a message ───────────────────────────────────────────────────────────

export async function sendMessage(
    chatId: string,
    senderId: string,
    senderName: string,
    text: string,
    senderPhoto?: string | null,
): Promise<{ success: boolean; error?: string }> {
    try {
        const trimmed = text.trim();
        if (!trimmed) return { success: false, error: 'Mensaje vacío' };
        if (trimmed.length > 2000) return { success: false, error: 'Mensaje muy largo (máx. 2000 caracteres)' };

        const msgRef = collection(db, CHATS, chatId, MESSAGES);
        await addDoc(msgRef, {
            chatId,
            senderId,
            senderName,
            senderPhoto: senderPhoto || null,
            text: trimmed,
            isRead: false,
            createdAt: serverTimestamp(),
        });

        // Update chat summary.
        // Only increment unreadCount — the UI will filter it out
        // on the SENDER's side by checking lastSenderId !== currentUserId.
        await updateDoc(doc(db, CHATS, chatId), {
            lastMessage: trimmed,
            lastMessageAt: serverTimestamp(),
            lastSenderId: senderId,  // <— track who sent last
            unreadCount: increment(1),
        });

        // Trigger in-app notification for the recipient
        // Extract recipient from chatId (deterministic [id1, id2].join('_'))
        const ids = chatId.split('_');
        const recipientId = ids.find(id => id !== senderId);
        if (recipientId) {
            createNotification({
                userId: recipientId,
                type: 'message',
                title: `Nuevo mensaje de ${senderId === ids[0] && ids.length > 2 ? 'usuario' : senderName}`,
                body: trimmed.length > 60 ? trimmed.substring(0, 57) + '...' : trimmed,
                relatedId: chatId,
            });
        }

        return { success: true };
    } catch (err) {
        logger.error('sendMessage error');
        return { success: false, error: 'No se pudo enviar el mensaje' };
    }
}

// ─── Real-time listeners ──────────────────────────────────────────────────────

/** Subscribe to all chats where the user is a participant */
export function subscribeToChats(
    userId: string,
    callback: (chats: Chat[]) => void,
): () => void {
    const q = query(
        collection(db, CHATS),
        where('participants', 'array-contains', userId),
    );

    return onSnapshot(q, (snap) => {
        const chats = snap.docs
            .map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    ...data,
                    lastMessageAt: toISO(data.lastMessageAt),
                } as Chat;
            })
            // Sort by most recent locally (avoids composite index)
            .sort((a, b) =>
                new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
            );
        callback(chats);
    }, (err) => {
        logger.error('subscribeToChats error');
        callback([]);
    });
}

/** Subscribe to messages inside a specific chat, ordered by createdAt */
export function subscribeToMessages(
    chatId: string,
    callback: (messages: ChatMessage[]) => void,
): () => void {
    const q = query(
        collection(db, CHATS, chatId, MESSAGES),
        orderBy('createdAt', 'asc'),
    );

    return onSnapshot(q, (snap) => {
        const messages = snap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                createdAt: toISO(data.createdAt),
            } as ChatMessage;
        });
        callback(messages);
    }, (err) => {
        logger.error('subscribeToMessages error');
        callback([]);
    });
}

/** Mark all messages in a chat as read for the current user */
export async function markChatAsRead(chatId: string): Promise<void> {
    try {
        await updateDoc(doc(db, CHATS, chatId), { unreadCount: 0 });
    } catch {
        // Non-critical, ignore
    }
}
