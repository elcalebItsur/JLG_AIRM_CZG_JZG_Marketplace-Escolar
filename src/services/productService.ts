import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    doc,
    getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Product } from '@/types/product';
import { uploadImage } from './storageService';

const COLLECTION_NAME = 'products';

export const getProducts = async (): Promise<Product[]> => {
    try {
        const q = query(collection(db, COLLECTION_NAME), where('status', '==', 'active'));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Product));
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
};

export const createProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'status'>): Promise<{ success: boolean; product?: Product; error?: string }> => {
    try {
        // Handle image upload if exists
        let imageUrls: string[] = [];
        if (productData.images && productData.images.length > 0) {
            // Assume the first image is the local URI we want to upload
            // In a real app we would loop through all
            const localUri = productData.images[0];
            if (localUri.startsWith('file://') || localUri.startsWith('content://')) {
                const path = `products/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
                const url = await uploadImage(localUri, path);
                if (url) imageUrls = [url];
            } else {
                imageUrls = productData.images; // Keep existing if not local
            }
        }

        const newProductData = {
            ...productData,
            images: imageUrls.length > 0 ? imageUrls : ['https://via.placeholder.com/300'],
            createdAt: new Date().toISOString(),
            status: 'active',
        };

        const docRef = await addDoc(collection(db, COLLECTION_NAME), newProductData);

        const newProduct: Product = {
            id: docRef.id,
            ...newProductData
        } as Product;

        return { success: true, product: newProduct };
    } catch (error) {
        console.error('Error adding product:', error);
        return { success: false, error: 'No se pudo guardar el producto' };
    }
};

export const getMyProducts = async (userId: string): Promise<Product[]> => {
    try {
        const q = query(collection(db, COLLECTION_NAME), where('sellerId', '==', userId));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Product));
    } catch (error) {
        console.error('Error fetching my products:', error);
        return [];
    }
};

export const getProductById = async (id: string): Promise<Product | undefined> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Product;
        } else {
            return undefined;
        }
    } catch (error) {
        console.error('Error fetching product details:', error);
        return undefined;
    }
}
