export interface Review {
    id: string;
    sellerId: string;
    reviewerId: string;
    reviewerName: string;
    rating: 1 | 2 | 3 | 4 | 5;
    comment: string;
    productId: string;
    productTitle: string;
    createdAt: string; // ISO
}
