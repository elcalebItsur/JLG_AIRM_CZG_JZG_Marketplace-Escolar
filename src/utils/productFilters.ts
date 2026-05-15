import { Product } from '@/types/product';
import { normalizeText } from './text';

export interface FilterOptions {
    category?: string;
    searchText?: string;
    minPrice?: string;
    maxPrice?: string;
    condition?: string | null;
}

/**
 * Filters a list of products based on multiple criteria.
 */
export const filterProducts = (products: Product[], options: FilterOptions): Product[] => {
    return products.filter(p => {
        // Category Filter
        if (options.category && options.category !== 'Todos') {
            if (normalizeText(p.category ?? '') !== normalizeText(options.category)) return false;
        }

        // Search Text Filter
        if (options.searchText && options.searchText.trim()) {
            const q = normalizeText(options.searchText.trim());
            const inTitle = normalizeText(p.title ?? '').includes(q);
            const inDesc = normalizeText(p.description ?? '').includes(q);
            const inSeller = normalizeText(p.sellerName ?? '').includes(q);
            if (!inTitle && !inDesc && !inSeller) return false;
        }

        // Min Price Filter
        if (options.minPrice) {
            const min = parseFloat(options.minPrice);
            if (!isNaN(min) && p.price < min) return false;
        }

        // Max Price Filter
        if (options.maxPrice) {
            const max = parseFloat(options.maxPrice);
            if (!isNaN(max) && p.price > max) return false;
        }

        // Condition Filter
        if (options.condition && p.condition !== options.condition) return false;

        return true;
    });
};
