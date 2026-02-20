export type ProductStatus = 'ACTIVE' | 'SOLD' | 'ARCHIVED';

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  ownerId: string;
  status: ProductStatus;
  createdAt: string; // ISO
}
