/**
 * notificationService.ts — In-app notifications stored in Firestore.
 * Writes to the `notifications` collection. No push/APNs needed.
 */
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    updateDoc,
    doc,
    getDocs,
    serverTimestamp,
    Timestamp,
    writeBatch,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { AppNotification, NotificationType } from '@/types/notification';
import { logger } from '@/utils/logger';

const COL = 'notifications';

function toISO(v: unknown): string {
    if (!v) return new Date().toISOString();
    if (v instanceof Timestamp) return v.toDate().toISOString();
    if (typeof v === 'string') return v;
    return new Date().toISOString();
}

export interface CreateNotificationParams {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    relatedId?: string;
}

/** Write a new notification document (fire-and-forget safe) */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
    try {
        const raw: Record<string, unknown> = {
            userId: params.userId,
            type: params.type,
            title: params.title,
            body: params.body,
            isRead: false,
            createdAt: serverTimestamp(),
        };
        if (params.relatedId !== undefined) raw.relatedId = params.relatedId;
        await addDoc(collection(db, COL), raw);
    } catch (err) {
        logger.error('createNotification error');
    }
}

/** Subscribe to a user's notifications, newest first */
export function subscribeToNotifications(
    userId: string,
    callback: (notifs: AppNotification[]) => void,
): () => void {
    const q = query(
        collection(db, COL),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
    );
    return onSnapshot(q, (snap) => {
        const notifs = snap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                createdAt: toISO(data.createdAt),
            } as AppNotification;
        });
        callback(notifs);
    }, (err) => {
        logger.error('subscribeToNotifications error');
        callback([]);
    });
}

/** Mark a single notification as read */
export async function markNotificationRead(notifId: string): Promise<void> {
    try {
        await updateDoc(doc(db, COL, notifId), { isRead: true });
    } catch { /* non-critical */ }
}

/** Mark all of a user's notifications as read (batch) */
export async function markAllNotificationsRead(userId: string): Promise<void> {
    try {
        const snap = await getDocs(
            query(collection(db, COL), where('userId', '==', userId), where('isRead', '==', false))
        );
        if (snap.empty) return;
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.update(d.ref, { isRead: true }));
        await batch.commit();
    } catch (err) {
        logger.error('markAllNotificationsRead error');
    }
}
