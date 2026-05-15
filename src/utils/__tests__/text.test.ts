import { normalizeText, formatPrice } from '../text';

describe('Text Utilities', () => {
    
    describe('normalizeText', () => {
        it('should remove accents and lowercase the text', () => {
            expect(normalizeText('México')).toBe('mexico');
            expect(normalizeText('Campaña')).toBe('campana');
            expect(normalizeText('ÁÉÍÓÚáéíóú')).toBe('aeiouaeiou');
        });

        it('should handle empty strings or null', () => {
            expect(normalizeText('')).toBe('');
            // @ts-ignore
            expect(normalizeText(null)).toBe('');
        });

        it('should preserve numbers and symbols', () => {
            expect(normalizeText('iPhone 12!')).toBe('iphone 12!');
        });
    });

    describe('formatPrice', () => {
        it('should format numbers correctly as MXN currency', () => {
            // Note: Intl format might include non-breaking spaces depending on environment
            // We use a regex or just check the presence of $ and digits
            const formatted = formatPrice(1500.50);
            expect(formatted).toContain('$');
            expect(formatted).toContain('1,500.50');
        });

        it('should handle zero', () => {
            const formatted = formatPrice(0);
            expect(formatted).toContain('$0.00');
        });
    });

});
