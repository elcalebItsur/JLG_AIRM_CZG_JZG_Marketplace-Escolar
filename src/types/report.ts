export type ReportReason = 'spam' | 'inappropriate' | 'fraud' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed';
export type ReportTargetType = 'product' | 'user';

export interface Report {
    id: string;
    reporterId: string;
    reporterName: string;
    targetType: ReportTargetType;
    targetId: string;
    targetTitle: string;
    reason: ReportReason;
    details?: string;
    status: ReportStatus;
    createdAt: string;        // ISO string
    reviewedAt?: string;
}

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
    spam: 'Spam o publicidad engañosa',
    inappropriate: 'Contenido inapropiado',
    fraud: 'Fraude o estafa',
    other: 'Otro motivo',
};
