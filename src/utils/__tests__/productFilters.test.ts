import { filterProducts } from '../productFilters';
import { Product } from '@/types/product';

const mockProducts: Product[] = [
    {
        id: '1',
        title: 'Calculadora Científica',
        description: 'Perfecta para ingeniería',
        price: 500,
        category: 'Electrónica',
        sellerId: 'user1',
        sellerName: 'Juan Pérez',
        condition: 'new',
        status: 'active',
        images: [],
        createdAt: new Date().toISOString()
    },
    {
        id: '2',
        title: 'Bata de Laboratorio',
        description: 'Talla M, color blanco',
        price: 250,
        category: 'Uniformes',
        sellerId: 'user2',
        sellerName: 'María García',
        condition: 'good',
        status: 'active',
        images: [],
        createdAt: new Date().toISOString()
    },
    {
        id: '3',
        title: 'Libro de Cálculo',
        description: 'Leithold, 7ma edición',
        price: 800,
        category: 'Libros',
        sellerId: 'user1',
        sellerName: 'Juan Pérez',
        condition: 'acceptable',
        status: 'active',
        images: [],
        createdAt: new Date().toISOString()
    }
];

describe('Product Filters Logic', () => {

    it('should filter by category', () => {
        const results = filterProducts(mockProducts, { category: 'Libros' });
        expect(results).toHaveLength(1);
        expect(results[0].title).toBe('Libro de Cálculo');
    });

    it('should filter by search text (case insensitive and accents)', () => {
        const results = filterProducts(mockProducts, { searchText: 'calcul' });
        expect(results).toHaveLength(2); // Matches 'Calculadora' and 'Cálculo'
    });

    it('should filter by price range', () => {
        const results = filterProducts(mockProducts, { minPrice: '300', maxPrice: '600' });
        expect(results).toHaveLength(1);
        expect(results[0].title).toBe('Calculadora Científica');
    });

    it('should filter by condition', () => {
        const results = filterProducts(mockProducts, { condition: 'good' });
        expect(results).toHaveLength(1);
        expect(results[0].title).toBe('Bata de Laboratorio');
    });

    it('should return all products if no filters are applied', () => {
        const results = filterProducts(mockProducts, { category: 'Todos' });
        expect(results).toHaveLength(3);
    });

});
