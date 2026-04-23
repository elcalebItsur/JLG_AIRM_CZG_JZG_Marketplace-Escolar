/**
 * reviewService.ts — Seller reviews and star ratings with Firestore.
 *
 * Data model (from Arquitectura_Base_de_Datos.md):
 *   /reviews/{reviewId}
 *     sellerId, reviewerId, reviewerName, rating (1-5),
 *     comment, productId, productTitle, createdAt
 *
 * After each review write we recompute and update the seller's
 * `sellerRating` field in /users/{sellerId}.
 */
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    doc,
    updateDoc,
    Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Review } from '@/types/review';

const REVIEWS = 'reviews';
const USERS = 'users';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISO(v: unknown): string {
    if (!v) return new Date().toISOString();
    if (v instanceof Timestamp) return v.toDate().toISOString();
    if (typeof v === 'string') return v;
    return new Date().toISOString();
}

function mapDoc(d: { id: string; data(): Record<string, unknown> }): Review {
    const data = d.data();
    return { id: d.id, ...data, createdAt: toISO(data.createdAt) } as Review;
}

// ─── Write a review ───────────────────────────────────────────────────────────

export interface AddReviewParams {
    sellerId: string;
    reviewerId: string;
    reviewerName: string;
    rating: 1 | 2 | 3 | 4 | 5;
    comment: string;
    productId: string;
    productTitle: string;
}

export async function addReview(
    params: AddReviewParams
): Promise<{ success: boolean; error?: string }> {
    try {
        // Validación de longitud
        if (params.comment && params.comment.length > 1000) {
            return { success: false, error: 'Comentario muy largo (máx. 1000 caracteres)' };
        }

        // Check: only one review per (reviewer, product)
        const existing = await getDocs(
            query(
                collection(db, REVIEWS),
                where('reviewerId', '==', params.reviewerId),
                where('productId', '==', params.productId),
            )
        );
        if (!existing.empty) {
            return { success: false, error: 'Ya dejaste una reseña para este producto' };
        }

        await addDoc(collection(db, REVIEWS), {
            ...params,
            createdAt: serverTimestamp(),
        });

        // Recompute seller average rating
        await _updateSellerRating(params.sellerId);

        return { success: true };
    } catch (err) {
        console.error('addReview error');
        return { success: false, error: 'No se pudo guardar la reseña' };
    }
}

/** Fetch all reviews for a seller, compute avg, persist to /users/{sellerId} */
async function _updateSellerRating(sellerId: string): Promise<void> {
    try {
        const snap = await getDocs(
            query(collection(db, REVIEWS), where('sellerId', '==', sellerId))
        );
        if (snap.empty) return;
        const avg =
            snap.docs.reduce((sum, d) => sum + ((d.data().rating as number) ?? 0), 0) /
            snap.size;
        await updateDoc(doc(db, USERS, sellerId), {
            sellerRating: Math.round(avg * 10) / 10, // 1 decimal
        });
    } catch (err) {
        // Non-fatal — rating update is best-effort
        console.warn('_updateSellerRating error');
    }
}

// ─── Fetch reviews (one-shot) ─────────────────────────────────────────────────

export async function getSellerReviews(sellerId: string): Promise<Review[]> {
    try {
        const snap = await getDocs(
            query(collection(db, REVIEWS), where('sellerId', '==', sellerId))
        );
        const reviews = snap.docs.map(mapDoc);
        return reviews.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    } catch (err) {
        console.error('getSellerReviews error');
        return [];
    }
}

/** Check if a user already reviewed a specific product */
export async function hasReviewed(reviewerId: string, productId: string): Promise<boolean> {
    try {
        const snap = await getDocs(
            query(
                collection(db, REVIEWS),
                where('reviewerId', '==', reviewerId),
                where('productId', '==', productId),
            )
        );
        return !snap.empty;
    } catch {
        return false;
    }
}

// ─── Real-time subscription ───────────────────────────────────────────────────

/** Subscribe to ALL reviews for a seller (newest first, client-sorted) */
export function subscribeToSellerReviews(
    sellerId: string,
    callback: (reviews: Review[]) => void
): () => void {
    const q = query(collection(db, REVIEWS), where('sellerId', '==', sellerId));
    return onSnapshot(q, (snap) => {
        const reviews = snap.docs
            .map(mapDoc)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(reviews);
    }, (err) => {
        console.error('subscribeToSellerReviews error');
        callback([]);
    });
}
