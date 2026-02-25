export interface ChatMessage {
    id: string;
    chatId: string;
    senderId: string;
    senderName: string;
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
    /** UIDs of both participants */
    participants: string[];
    /** uid → displayName map for quick lookup */
    participantsMap: Record<string, string>;
    buyerId: string;
    sellerId: string;
    lastMessage: string;
    lastMessageAt: string; // ISO
    unreadCount: number;
}
