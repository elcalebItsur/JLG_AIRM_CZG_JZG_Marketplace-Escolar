/**
 * Removes accents and converts to lowercase for easy searching.
 */
export const normalizeText = (s: string): string => {
    if (!s) return '';
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
};

/**
 * Formats a number as a currency string (MXN).
 */
export const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
    }).format(price);
};
