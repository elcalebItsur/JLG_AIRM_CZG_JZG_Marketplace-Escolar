export type NotificationType =
    | 'message'
    | 'sold'
    | 'confirmed'
    | 'report_resolved'
    | 'general';

export interface AppNotification {
    id: string;
    userId: string;           // recipient
    type: NotificationType;
    title: string;
    body: string;
    isRead: boolean;
    relatedId?: string;       // productId, chatId, reportId, etc.
    createdAt: string;        // ISO string
}
