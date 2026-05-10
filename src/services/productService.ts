import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    increment,
    serverTimestamp,
    onSnapshot,
    runTransaction,
    Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Product, ProductStatus } from '@/types/product';
import { uploadImage, deleteImageByUrl } from './storageService';

const COLLECTION = 'products';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapProduct(d: { id: string; data(): Record<string, unknown> }): Product {
    const data = d.data();
    // Handle Firestore Timestamp to ISO string
    let createdAt = new Date().toISOString();
    if (data.createdAt instanceof Timestamp) {
        createdAt = data.createdAt.toDate().toISOString();
    } else if (typeof data.createdAt === 'string') {
        createdAt = data.createdAt;
    }

    return {
        id: d.id,
        ...data,
        createdAt,
    } as Product;
}

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
        console.error('getProducts error');
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
        console.error('getProductById error');
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
        const products = snap.docs.map(mapProduct);
        // Sort client-side to avoid needing a composite Firestore index
        return products.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    } catch (error) {
        console.error('getMyProducts error');
        return [];
    }
};

// ─── Real-time Subscriptions ──────────────────────────────────────────────────

/** Subscribe to active products */
export const subscribeToProducts = (
    callback: (products: Product[]) => void
): () => void => {
    const q = query(
        collection(db, COLLECTION),
        where('status', '==', 'active')
    );

    return onSnapshot(q, (snap) => {
        const products = snap.docs.map(mapProduct);
        const sorted = products.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        callback(sorted);
    }, (err) => {
        console.error('subscribeToProducts error');
        callback([]);
    });
};

/** Subscribe to a specific product by ID */
export const subscribeToProductById = (
    id: string,
    callback: (product: Product | undefined) => void
): () => void => {
    const ref = doc(db, COLLECTION, id);
    return onSnapshot(ref, (snap) => {
        if (!snap.exists()) {
            callback(undefined);
            return;
        }
        // Increment view count handled separately in getProductById if needed,
        // but for real-time we just map the data.
        callback(mapProduct(snap));
    }, (err) => {
        console.error('subscribeToProductById error');
        callback(undefined);
    });
};

/** Subscribe to products for a specific seller */
export const subscribeToMyProducts = (
    userId: string,
    callback: (products: Product[]) => void
): () => void => {
    const q = query(
        collection(db, COLLECTION),
        where('sellerId', '==', userId)
    );

    return onSnapshot(q, (snap) => {
        const products = snap.docs.map(mapProduct);
        const sorted = products.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        callback(sorted);
    }, (err) => {
        console.error('subscribeToMyProducts error');
        callback([]);
    });
};

/** Create a new product, uploading a single image first if provided */
export const createProduct = async (
    productData: Omit<Product, 'id' | 'createdAt' | 'status' | 'viewCount'>
): Promise<{ success: boolean; product?: Product; error?: string }> => {
    try {
        // Validación de longitud de campos
        const title = (productData as any).title || '';
        const description = (productData as any).description || '';
        if (title.length > 200) return { success: false, error: 'El título es muy largo (máx. 200 caracteres)' };
        if (description.length > 5000) return { success: false, error: 'La descripción es muy larga (máx. 5000 caracteres)' };

        let imageUrls: string[] = [];

        // Limit to 1 image max
        const rawImages = productData.images ?? [];
        const firstImage = rawImages[0];

        if (firstImage) {
            if (firstImage.startsWith('data:')) {
                // Already a data URI (base64), use directly
                imageUrls = [firstImage];
            } else if (firstImage.startsWith('http://') || firstImage.startsWith('https://')) {
                // Remote URL, use directly
                imageUrls = [firstImage];
            } else {
                // Local file URI — compress and convert to base64 data URI
                const dataUri = await uploadImage(firstImage);
                if (dataUri) imageUrls = [dataUri];
            }
        }

        const payload = {
            ...productData,
            images: imageUrls,
            status: 'active',
            viewCount: 0,
            stock: productData.stock ?? 1,
            isFeatured: false,
            createdAt: serverTimestamp(),
        };

        const ref = await addDoc(collection(db, COLLECTION), payload);
        const newProduct = { id: ref.id, ...payload, createdAt: new Date().toISOString() } as unknown as Product;
        return { success: true, product: newProduct };
    } catch (error) {
        console.error('createProduct error');
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
        console.error('updateProduct error');
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

/** Delete a product and its associated image from Storage */
export const deleteProduct = async (
    id: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        // First fetch the product to get its image URL
        const ref = doc(db, COLLECTION, id);
        const snap = await getDoc(ref);

        if (snap.exists()) {
            const data = snap.data() as Product;
            // Delete associated image from Storage
            const imageUrl = data.images?.[0];
            if (imageUrl) {
                await deleteImageByUrl(imageUrl);
            }
        }

        // Delete the Firestore document
        await deleteDoc(ref);
        return { success: true };
    } catch (error) {
        console.error('deleteProduct error');
        return { success: false, error: 'No se pudo eliminar el producto' };
    }
};

/** 
 * Safely reduce stock using a transaction. 
 * If stock reaches 0, status is set to 'sold'.
 */
export const reduceProductStock = async (
    productId: string,
    quantity: number
): Promise<{ success: boolean; newStock: number; error?: string }> => {
    try {
        const productRef = doc(db, COLLECTION, productId);
        
        return await runTransaction(db, async (transaction) => {
            const productDoc = await transaction.get(productRef);
            if (!productDoc.exists()) {
                throw new Error('El producto no existe');
            }

            const data = productDoc.data() as Product;
            const currentStock = data.stock ?? 1;
            const newStock = Math.max(0, currentStock - quantity);

            const update: Partial<Product> = { stock: newStock };
            if (newStock <= 0) {
                update.status = 'sold';
            }

            transaction.update(productRef, update);
            return { success: true, newStock };
        });
    } catch (error: any) {
        console.error('reduceProductStock error:', error);
        return { success: false, newStock: 0, error: error.message || 'No se pudo actualizar el stock' };
    }
};
