/**
 * adminService.ts — Aggregate stats for the Admin Dashboard.
 * All functions require admin-level Firestore access (enforced by security rules).
 */
import {
    collection,
    getDocs,
    query,
    where,
    getCountFromServer,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { logger } from '@/utils/logger';

export interface AdminStats {
    totalUsers: number;
    activeProducts: number;
    pendingReports: number;
    totalTransactions: number;
    completedTransactions: number;
}

/**
 * Fetch dashboard stats in parallel.
 * Uses `getCountFromServer` (Firestore count aggregation) for efficiency.
 */
export async function getAdminStats(): Promise<AdminStats> {
    try {
        const [
            usersSnap,
            activeProductsSnap,
            pendingReportsSnap,
            totalTxSnap,
            completedTxSnap,
        ] = await Promise.all([
            getCountFromServer(collection(db, 'users')),
            getCountFromServer(query(collection(db, 'products'), where('status', '==', 'active'))),
            getCountFromServer(query(collection(db, 'reports'), where('status', '==', 'pending'))),
            getCountFromServer(collection(db, 'transactions')),
            getCountFromServer(query(collection(db, 'transactions'), where('status', '==', 'completed'))),
        ]);

        return {
            totalUsers: usersSnap.data().count,
            activeProducts: activeProductsSnap.data().count,
            pendingReports: pendingReportsSnap.data().count,
            totalTransactions: totalTxSnap.data().count,
            completedTransactions: completedTxSnap.data().count,
        };
    } catch (err) {
        logger.error('getAdminStats error:', err);
        return {
            totalUsers: 0,
            activeProducts: 0,
            pendingReports: 0,
            totalTransactions: 0,
            completedTransactions: 0,
        };
    }
}
