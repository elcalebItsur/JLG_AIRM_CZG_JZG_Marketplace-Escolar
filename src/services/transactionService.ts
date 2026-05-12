/**
 * transactionService.ts — Records and tracks sale transactions.
 *
 * /transactions/{txId}
 *   productId, productTitle, productImage?, price,
 *   sellerId, sellerName, buyerId, buyerName,
 *   status: 'pending' | 'completed' | 'cancelled',
 *   createdAt, completedAt?
 */
import {
    collection,
    addDoc,
    doc,
    updateDoc,
    query,
    where,
    getDocs,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Transaction, TransactionStatus } from '@/types/transaction';
import { logger } from '@/utils/logger';

const TRANSACTIONS = 'transactions';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISO(v: unknown): string {
    if (!v) return new Date().toISOString();
    if (v instanceof Timestamp) return v.toDate().toISOString();
    if (typeof v === 'string') return v;
    return new Date().toISOString();
}

function mapTx(d: { id: string; data(): Record<string, unknown> }): Transaction {
    const data = d.data();
    return {
        id: d.id,
        ...data,
        createdAt: toISO(data.createdAt),
        completedAt: data.completedAt ? toISO(data.completedAt) : undefined,
    } as Transaction;
}

// ─── Create a transaction ─────────────────────────────────────────────────────

export interface CreateTransactionParams {
    productId: string;
    productTitle: string;
    productImage?: string;
    price: number;
    sellerId: string;
    sellerName: string;
    buyerId: string;
    buyerName: string;
    quantity: number;
}

export async function createTransaction(
    params: CreateTransactionParams
): Promise<{ txId: string; error?: string }> {
    try {
        const payload: Record<string, unknown> = {
            productId: params.productId,
            productTitle: params.productTitle,
            price: params.price,
            sellerId: params.sellerId,
            sellerName: params.sellerName,
            buyerId: params.buyerId,
            buyerName: params.buyerName,
            quantity: params.quantity,
            status: 'pending' as TransactionStatus,
            createdAt: serverTimestamp(),
        };
        // Only include optional fields if defined
        if (params.productImage !== undefined) payload.productImage = params.productImage;

        const ref = await addDoc(collection(db, TRANSACTIONS), payload);
        return { txId: ref.id };
    } catch (err) {
        logger.error('createTransaction error');
        return { txId: '', error: 'No se pudo registrar la transacción' };
    }
}

// ─── Update status ────────────────────────────────────────────────────────────

export async function updateTransactionStatus(
    txId: string,
    status: TransactionStatus
): Promise<{ success: boolean; error?: string }> {
    try {
        const update: Record<string, unknown> = { status };
        if (status === 'completed') update.completedAt = serverTimestamp();
        await updateDoc(doc(db, TRANSACTIONS, txId), update);
        return { success: true };
    } catch (err) {
        logger.error('updateTransactionStatus error');
        return { success: false, error: 'No se pudo actualizar la transacción' };
    }
}

// ─── Fetch transactions ───────────────────────────────────────────────────────

/** All transactions where I am the SELLER */
export async function getSellerTransactions(sellerId: string): Promise<Transaction[]> {
    try {
        const snap = await getDocs(
            query(collection(db, TRANSACTIONS), where('sellerId', '==', sellerId))
        );
        return snap.docs.map(mapTx).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    } catch (err) {
        logger.error('getSellerTransactions error');
        return [];
    }
}

/** All transactions where I am the BUYER */
export async function getBuyerTransactions(buyerId: string): Promise<Transaction[]> {
    try {
        const snap = await getDocs(
            query(collection(db, TRANSACTIONS), where('buyerId', '==', buyerId))
        );
        return snap.docs.map(mapTx).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    } catch (err) {
        logger.error('getBuyerTransactions error');
        return [];
    }
}

/** Fetch chat participants who messaged about a specific product — used to suggest the buyer */
export async function getChatBuyersForProduct(
    sellerId: string,
    productId: string
): Promise<Array<{ uid: string; name: string }>> {
    try {
        // To satisfy security rules, we MUST filter by participants array contains current user ID.
        // We fetch ALL chats for the seller and filter by product in memory.
        // This avoids "Missing Permissions" and "Multiple array-contains" errors.
        const q = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', sellerId)
        );

        const snap = await getDocs(q);
        const seen = new Set<string>();
        const acc: Array<{ uid: string; name: string }> = [];

        snap.docs.forEach(d => {
            const data = d.data();
            
            // Check if this chat is relevant to the product
            const isRelevant = 
                data.productId === productId || 
                (data.discussedProductIds && Array.isArray(data.discussedProductIds) && data.discussedProductIds.includes(productId));

            if (!isRelevant) return;

            const participants = (data.participants || []) as string[];
            const otherId = participants.find(id => id !== sellerId);
            
            if (!otherId || seen.has(otherId)) return;
            seen.add(otherId);
            
            const name = (data.participantsMap as Record<string, string>)[otherId] ?? 'Interesado';
            acc.push({ uid: otherId, name });
        });

        return acc;
    } catch (err: any) {
        logger.error('getChatBuyersForProduct error:', err);
        return [];
    }
}
/** Find a pending transaction for a specific product and buyer */
export async function getPendingTransaction(
    productId: string,
    buyerId: string
): Promise<Transaction | null> {
    try {
        const snap = await getDocs(
            query(
                collection(db, TRANSACTIONS),
                where('productId', '==', productId),
                where('buyerId', '==', buyerId),
                where('status', '==', 'pending' as TransactionStatus)
            )
        );
        if (snap.empty) return null;
        return mapTx(snap.docs[0]);
    } catch (err) {
        logger.error('getPendingTransaction error');
        return null;
    }
}
