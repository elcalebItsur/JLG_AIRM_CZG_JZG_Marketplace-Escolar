export type TransactionStatus = 'pending' | 'completed' | 'cancelled';

export interface Transaction {
    id: string;
    productId: string;
    productTitle: string;
    productImage?: string;
    price: number;
    quantity: number;
    sellerId: string;
    sellerName: string;
    buyerId: string;
    buyerName: string;
    status: TransactionStatus;
    createdAt: string; // ISO — when the seller marked as sold
    completedAt?: string; // ISO — when buyer confirmed receipt
}
