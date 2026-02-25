/**
 * reportService.ts — Report abusive products or users.
 * Reports land in the `reports` Firestore collection.
 * Admin-only reads; any authenticated user can create.
 */
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    updateDoc,
    doc,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Report, ReportReason, ReportStatus, ReportTargetType } from '@/types/report';
import { updateProductStatus } from './productService';

const COL = 'reports';

function toISO(v: unknown): string {
    if (!v) return new Date().toISOString();
    if (v instanceof Timestamp) return v.toDate().toISOString();
    if (typeof v === 'string') return v;
    return new Date().toISOString();
}

export interface CreateReportParams {
    reporterId: string;
    reporterName: string;
    targetType: ReportTargetType;
    targetId: string;
    targetTitle: string;
    reason: ReportReason;
    details?: string;
}

/** Any user can submit a report */
export async function createReport(params: CreateReportParams): Promise<{ success: boolean; error?: string }> {
    try {
        const raw: Record<string, unknown> = {
            reporterId: params.reporterId,
            reporterName: params.reporterName,
            targetType: params.targetType,
            targetId: params.targetId,
            targetTitle: params.targetTitle,
            reason: params.reason,
            status: 'pending' as ReportStatus,
            createdAt: serverTimestamp(),
        };
        if (params.details) raw.details = params.details;
        await addDoc(collection(db, COL), raw);
        return { success: true };
    } catch (err) {
        console.error('createReport error:', err);
        return { success: false, error: 'No se pudo enviar el reporte' };
    }
}

/** Admin: fetch all reports, optionally filtered by status */
export async function getReports(status?: ReportStatus): Promise<Report[]> {
    try {
        const q = status
            ? query(collection(db, COL), where('status', '==', status))
            : query(collection(db, COL));
        const snap = await getDocs(q);
        const reports = snap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                ...data,
                createdAt: toISO(data.createdAt),
                reviewedAt: data.reviewedAt ? toISO(data.reviewedAt) : undefined,
            } as Report;
        });
        return reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
        console.error('getReports error:', err);
        return [];
    }
}

/** Admin: update report status (reviewed / dismissed) */
export async function updateReportStatus(
    reportId: string,
    status: ReportStatus,
): Promise<{ success: boolean; error?: string }> {
    try {
        await updateDoc(doc(db, COL, reportId), {
            status,
            reviewedAt: serverTimestamp(),
        });
        return { success: true };
    } catch (err) {
        console.error('updateReportStatus error:', err);
        return { success: false, error: 'No se pudo actualizar el reporte' };
    }
}

/** Admin: remove a flagged product from the marketplace */
export async function adminDeleteProduct(productId: string): Promise<{ success: boolean; error?: string }> {
    try {
        // We mark it as 'removed' (a new status) rather than hard-deleting
        const { error } = await updateProductStatus(productId, 'removed' as any);
        if (error) return { success: false, error };
        return { success: true };
    } catch (err) {
        console.error('adminDeleteProduct error:', err);
        return { success: false, error: 'No se pudo eliminar el producto' };
    }
}
