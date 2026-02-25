import React, { useEffect, useState } from 'react';
import {
    View, FlatList, StyleSheet, ActivityIndicator,
    Text, TouchableOpacity, ScrollView, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Product } from '@/types/product';
import { getProducts } from '@/services/productService';
import { ProductCard } from '@/components/product/ProductCard';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types/role';
import { AdminDashboardView } from '@/components/admin/AdminDashboardView';

import type { ComponentProps } from 'react';

type CategoryItem = { label: string; icon: ComponentProps<typeof Ionicons>['name'] };
const CATEGORIES: CategoryItem[] = [
    { label: 'Todos', icon: 'grid-outline' },
    { label: 'Libros', icon: 'book-outline' },
    { label: 'Electrónica', icon: 'laptop-outline' },
    { label: 'Ropa', icon: 'shirt-outline' },
    { label: 'Papelería', icon: 'pencil-outline' },
    { label: 'Servicios', icon: 'construct-outline' },
    { label: 'Otros', icon: 'cube-outline' },
];

export default function HomeScreen() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>('Todos');
    const [showMarketplace, setShowMarketplace] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

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

    if (user?.role === Role.ADMIN && !showMarketplace) {
        return (
            <View style={styles.root}>
                <View style={[styles.topBar, { paddingBottom: 10 }]}>
                    <View>
                        <Text style={styles.greetingSmall}>Vista de Administrador</Text>
                        <Text style={styles.greetingBig}>Dashboard Global</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.marketplaceToggle}
                        onPress={() => setShowMarketplace(true)}
                    >
                        <Ionicons name="cart-outline" size={20} color={colors.primary} />
                        <Text style={styles.toggleText}>Ver Marketplace</Text>
                    </TouchableOpacity>
                </View>
                <AdminDashboardView />
            </View>
        );
    }

    return (
        <View style={styles.root}>
            {/* Sticky top section */}
            <View style={styles.topBar}>
                {/* Branding row */}
                <View style={styles.brandRow}>
                    <View style={styles.brandLeft}>
                        <View style={styles.brandIconWrap}>
                            <Ionicons name="storefront-outline" size={22} color={colors.textOnDark} />
                        </View>
                        <View>
                            <Text style={styles.brandTitle}>Marketplace</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Ionicons name="hand-left-outline" size={11} color="rgba(255,255,255,0.6)" />
                                <Text style={styles.greetingSmall}>Hola, {firstName}</Text>
                            </View>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        {user?.role === Role.ADMIN && (
                            <TouchableOpacity
                                style={styles.notificationBtn}
                                onPress={() => setShowMarketplace(false)}
                            >
                                <Ionicons name="stats-chart" size={20} color={colors.textOnDark} />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={styles.notificationBtn}
                            onPress={() => router.push('/notifications')}
                        >
                            <Ionicons name="notifications-outline" size={22} color={colors.textOnDark} />
                        </TouchableOpacity>
                    </View>
                </View>
                {/* Subtitle */}
                <Text style={styles.greetingBig}>¿Qué buscas hoy?</Text>
            </View>

            {/* Search bar (UI only) */}
            <View style={styles.searchBarWrapper}>
                <View style={styles.searchBar}>
                    <Ionicons name="search-outline" size={18} color={colors.textMuted} />
                    <Text style={styles.searchPlaceholder}>Buscar productos...</Text>
                </View>
            </View>

            {/* Category filter section */}
            <View style={styles.categoriesSection}>
                <Text style={styles.categoriesLabel}>Categorías</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesRow}
                >
                    {CATEGORIES.map(cat => {
                        const isActive = activeCategory === cat.label;
                        return (
                            <TouchableOpacity
                                key={cat.label}
                                style={[styles.chip, isActive && styles.chipActive]}
                                onPress={() => setActiveCategory(cat.label)}
                                activeOpacity={0.75}
                            >
                                <Ionicons
                                    name={cat.icon}
                                    size={14}
                                    color={isActive ? '#fff' : colors.primary}
                                />
                                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Products grid */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Cargando productos...</Text>
                </View>
            ) : filteredProducts.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="file-tray-outline" size={56} color={colors.border} />
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
                            onPress={() => router.push(`/products/${item.id}`)}
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
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 20,
        gap: 6,
    },
    brandRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    brandLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    brandIconWrap: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    brandTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.3,
        lineHeight: 22,
    },
    greetingSmall: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: 11,
        fontWeight: '500',
    },
    greetingBig: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
        marginTop: 2,
        opacity: 0.9,
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
    categoriesSection: {
        backgroundColor: colors.surface,
        paddingTop: 12,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    categoriesLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    categoriesRow: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.background,
        borderWidth: 1.5,
        borderColor: colors.border,
    },
    chipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    chipText: {
        fontSize: 12,
        fontWeight: '600',
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
    marketplaceToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    toggleText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.primary,
    },
});
