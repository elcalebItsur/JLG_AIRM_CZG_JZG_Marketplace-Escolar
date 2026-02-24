export type ProductStatus = 'active' | 'sold' | 'reserved' | 'deleted';
export type ProductCondition = 'new' | 'like_new' | 'good' | 'acceptable';

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  sellerId: string;
  sellerName: string;
  sellerRating?: number;
  status: ProductStatus;
  condition: ProductCondition;
  location?: string;
  viewCount?: number;
  isFeatured?: boolean;
  createdAt: string; // ISO
}
