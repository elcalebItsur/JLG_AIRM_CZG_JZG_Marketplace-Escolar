import React, { useEffect, useState } from 'react';
import {
    View, FlatList, StyleSheet, ActivityIndicator,
    Text, TouchableOpacity, ScrollView, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '@/types/product';
import { getProducts } from '@/services/productService';
import { ProductCard } from '@/components/product/ProductCard';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { useAuth } from '@/context/AuthContext';

const CATEGORIES = ['Todos', 'Libros', 'Electrónica', 'Ropa', 'Papelería', 'Servicios', 'Otros'];

export default function HomeScreen() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeCategory, setActiveCategory] = useState('Todos');
    const { user } = useAuth();

    useEffect(() => { loadProducts(); }, []);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const data = await getProducts();
            setProducts(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadProducts();
        setRefreshing(false);
    };

    const filteredProducts = activeCategory === 'Todos'
        ? products
        : products.filter(p =>
            p.category?.toLowerCase() === activeCategory.toLowerCase()
        );

    const firstName = user?.displayName?.split(' ')[0] || 'Estudiante';

    return (
        <View style={styles.root}>
            {/* Sticky top section */}
            <View style={styles.topBar}>
                {/* Greeting */}
                <View>
                    <Text style={styles.greetingSmall}>Hola, {firstName} 👋</Text>
                    <Text style={styles.greetingBig}>¿Qué buscas hoy?</Text>
                </View>
                <View style={styles.notificationBtn}>
                    <Ionicons name="notifications-outline" size={22} color={colors.textOnDark} />
                </View>
            </View>

            {/* Search bar (UI only) */}
            <View style={styles.searchBarWrapper}>
                <View style={styles.searchBar}>
                    <Ionicons name="search-outline" size={18} color={colors.textMuted} />
                    <Text style={styles.searchPlaceholder}>Buscar productos...</Text>
                </View>
            </View>

            {/* Category filter chips */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesRow}
            >
                {CATEGORIES.map(cat => (
                    <TouchableOpacity
                        key={cat}
                        style={[styles.chip, activeCategory === cat && styles.chipActive]}
                        onPress={() => setActiveCategory(cat)}
                    >
                        <Text style={[styles.chipText, activeCategory === cat && styles.chipTextActive]}>
                            {cat}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Products grid */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Cargando productos...</Text>
                </View>
            ) : filteredProducts.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyEmoji}>📭</Text>
                    <Text style={styles.emptyTitle}>Sin productos aquí</Text>
                    <Text style={styles.emptySubtitle}>
                        {activeCategory !== 'Todos'
                            ? `No hay productos en "${activeCategory}" aún.`
                            : 'Sé el primero en publicar algo.'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredProducts}
                    renderItem={({ item }) => (
                        <ProductCard
                            product={item}
                            onPress={() => console.log('go to product:', item.id)}
                        />
                    )}
                    keyExtractor={item => item.id}
                    numColumns={2}
                    contentContainerStyle={styles.list}
                    columnWrapperStyle={styles.columnWrapper}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={colors.primary}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.background,
    },
    topBar: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 20,
    },
    greetingSmall: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        fontWeight: '500',
    },
    greetingBig: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
        marginTop: 2,
    },
    notificationBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchBarWrapper: {
        backgroundColor: colors.primary,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: colors.surface,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    searchPlaceholder: {
        ...typography.presets.body,
        color: colors.textMuted,
    },
    categoriesRow: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: colors.border,
    },
    chipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    chipTextActive: {
        color: '#fff',
        fontWeight: '700',
    },
    list: {
        paddingHorizontal: 12,
        paddingBottom: 20,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    loadingText: {
        ...typography.presets.caption,
        color: colors.textMuted,
        marginTop: 8,
    },
    emptyEmoji: {
        fontSize: 52,
    },
    emptyTitle: {
        ...typography.presets.sectionTitle,
        color: colors.text,
        marginTop: 8,
    },
    emptySubtitle: {
        ...typography.presets.body,
        color: colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});
