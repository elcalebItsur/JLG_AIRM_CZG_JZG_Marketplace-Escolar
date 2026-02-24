import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    doc,
    getDoc,
    updateDoc,
    increment,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Product, ProductStatus } from '@/types/product';
import { uploadImage } from './storageService';

const COLLECTION = 'products';

/** Get all active products, newest first */
export const getProducts = async (): Promise<Product[]> => {
    try {
        const q = query(
            collection(db, COLLECTION),
            where('status', '==', 'active')
        );
        const snap = await getDocs(q);
        const products = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
        // Sort client-side to avoid needing a composite Firestore index
        return products.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    } catch (error) {
        console.error('getProducts error:', error);
        return [];
    }
};

/** Get single product by id and increment its view count */
export const getProductById = async (id: string): Promise<Product | undefined> => {
    try {
        const ref = doc(db, COLLECTION, id);
        const snap = await getDoc(ref);
        if (!snap.exists()) return undefined;
        // Increment view count (fire-and-forget, no await)
        updateDoc(ref, { viewCount: increment(1) }).catch(() => { });
        return { id: snap.id, ...snap.data() } as Product;
    } catch (error) {
        console.error('getProductById error:', error);
        return undefined;
    }
};

/** Get products for a specific seller */
export const getMyProducts = async (userId: string): Promise<Product[]> => {
    try {
        const q = query(
            collection(db, COLLECTION),
            where('sellerId', '==', userId)
        );
        const snap = await getDocs(q);
        const products = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
        // Sort client-side to avoid needing a composite Firestore index
        return products.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    } catch (error) {
        console.error('getMyProducts error:', error);
        return [];
    }
};

/** Create a new product, uploading any local images first */
export const createProduct = async (
    productData: Omit<Product, 'id' | 'createdAt' | 'status' | 'viewCount'>
): Promise<{ success: boolean; product?: Product; error?: string }> => {
    try {
        let imageUrls: string[] = [];

        if (productData.images?.length > 0) {
            const uploadPromises = productData.images.map(async (uri) => {
                if (uri.startsWith('file://') || uri.startsWith('content://')) {
                    const path = `products/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
                    return uploadImage(uri, path);
                }
                return uri; // already a remote URL
            });
            const results = await Promise.all(uploadPromises);
            imageUrls = results.filter(Boolean) as string[];
        }

        const payload = {
            ...productData,
            images: imageUrls,
            status: 'active',
            viewCount: 0,
            isFeatured: false,
            createdAt: serverTimestamp(),
        };

        const ref = await addDoc(collection(db, COLLECTION), payload);
        const newProduct = { id: ref.id, ...payload, createdAt: new Date().toISOString() } as unknown as Product;
        return { success: true, product: newProduct };
    } catch (error) {
        console.error('createProduct error:', error);
        return { success: false, error: 'No se pudo guardar el producto' };
    }
};

/** Update any fields on a product (seller only) */
export const updateProduct = async (
    id: string,
    data: Partial<Omit<Product, 'id' | 'sellerId' | 'createdAt'>>
): Promise<{ success: boolean; error?: string }> => {
    try {
        await updateDoc(doc(db, COLLECTION, id), data);
        return { success: true };
    } catch (error) {
        console.error('updateProduct error:', error);
        return { success: false, error: 'No se pudo actualizar el producto' };
    }
};

/** Convenience: change product status */
export const updateProductStatus = async (
    id: string,
    status: ProductStatus
): Promise<{ success: boolean; error?: string }> => {
    return updateProduct(id, { status });
};
