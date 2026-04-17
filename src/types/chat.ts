export interface ChatMessage {
    id: string;
    chatId: string;
    senderId: string;
    senderName: string;
    senderPhoto?: string | null;
    text: string;
    isRead: boolean;
    createdAt: string; // ISO — converted from Firestore Timestamp on read
}

export interface Chat {
    id: string;
    productId: string;
    productTitle: string;
    productImage?: string;
    productPrice: number;
    buyerPhoto?: string | null;
    sellerPhoto?: string | null;
    /** UIDs of both participants */
    participants: string[];
    /** uid → displayName map for quick lookup */
    participantsMap: Record<string, string>;
    /** uid → photoURL map for quick lookup */
    participantsPhotosMap: Record<string, string | null>;
    buyerId: string;
    sellerId: string;
    lastMessage: string;
    lastMessageAt: string; // ISO
    /** Who sent the last message — used to avoid counting own messages as unread */
    lastSenderId?: string;
    unreadCount: number;
}
