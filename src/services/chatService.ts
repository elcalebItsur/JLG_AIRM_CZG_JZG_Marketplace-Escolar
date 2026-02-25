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
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Chat, ChatMessage } from '@/types/chat';

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
}

/**
 * Returns an existing chat or creates a new one.
 * Uses a deterministic document ID based only on the two user IDs,
 * so there is at most ONE chat per user pair (regardless of product).
 * When a new product is discussed, the productId/title are updated on the chat.
 */
export async function getOrCreateChat(params: GetOrCreateChatParams): Promise<{ chatId: string; error?: string }> {
    try {
        const chatId = buildChatId(params.buyerId, params.sellerId);
        const ref = doc(db, CHATS, chatId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
            // Create brand-new chat
            const raw: Record<string, unknown> = {
                productId: params.productId,
                productTitle: params.productTitle,
                productPrice: params.productPrice,
                participants: [params.buyerId, params.sellerId],
                participantsMap: {
                    [params.buyerId]: params.buyerName,
                    [params.sellerId]: params.sellerName,
                },
                buyerId: params.buyerId,
                sellerId: params.sellerId,
                lastMessage: '',
                lastMessageAt: serverTimestamp(),
                unreadCount: 0,
            };
            if (params.productImage !== undefined) raw.productImage = params.productImage;
            await setDoc(ref, raw);
        } else {
            // Chat exists — update the product context so the header reflects
            // the product the buyer just tapped on.
            const update: Record<string, unknown> = {
                productId: params.productId,
                productTitle: params.productTitle,
                productPrice: params.productPrice,
            };
            if (params.productImage !== undefined) update.productImage = params.productImage;
            await updateDoc(ref, update);
        }

        return { chatId };
    } catch (err) {
        console.error('getOrCreateChat error:', err);
        return { chatId: '', error: 'No se pudo abrir el chat' };
    }
}

// ─── Send a message ───────────────────────────────────────────────────────────

export async function sendMessage(
    chatId: string,
    senderId: string,
    senderName: string,
    text: string,
): Promise<{ success: boolean; error?: string }> {
    try {
        const trimmed = text.trim();
        if (!trimmed) return { success: false, error: 'Mensaje vacío' };

        const msgRef = collection(db, CHATS, chatId, MESSAGES);
        await addDoc(msgRef, {
            chatId,
            senderId,
            senderName,
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

        return { success: true };
    } catch (err) {
        console.error('sendMessage error:', err);
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
        console.error('subscribeToChats error:', err);
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
        console.error('subscribeToMessages error:', err);
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
