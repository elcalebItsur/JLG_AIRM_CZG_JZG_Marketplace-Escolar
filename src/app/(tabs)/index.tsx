import React, { useEffect, useState } from 'react';
import {
    View, FlatList, StyleSheet, ActivityIndicator,
    Text, TouchableOpacity, ScrollView, RefreshControl,
    TextInput, useWindowDimensions, Platform, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Product } from '@/types/product';
import { subscribeToProducts } from '@/services/productService';
import { ProductCard } from '@/components/product/ProductCard';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types/role';
import { AdminDashboardView } from '@/components/admin/AdminDashboardView';
import { useDebounce } from '@/utils/useDebounce';
import { SkeletonCard } from '@/components/ui/SkeletonCard';

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
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 300);
    const { user } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    const isLargeScreen = width > 800;

    // Responsive columns logic
    const getColumns = () => {
        if (width >= 1400) return 6;
        if (width >= 1100) return 4;
        if (width >= 768) return 3;
        return 2;
    };

    const numColumns = getColumns();

    useEffect(() => {
        setLoading(true);
        const unsubscribe = subscribeToProducts((data) => {
            setProducts(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loadProducts = async () => {
        setRefreshing(true);
        await new Promise(r => setTimeout(r, 800));
        setRefreshing(false);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadProducts();
        setRefreshing(false);
    };

    const normalize = (s: string) =>
        s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    // Combined filter: category + search text
    const filteredProducts = products.filter(p => {
        if (activeCategory !== 'Todos') {
            if (normalize(p.category ?? '') !== normalize(activeCategory)) return false;
        }
        if (debouncedSearch.trim()) {
            const q = normalize(debouncedSearch.trim());
            const inTitle = normalize(p.title ?? '').includes(q);
            const inDesc = normalize(p.description ?? '').includes(q);
            const inSeller = normalize(p.sellerName ?? '').includes(q);
            if (!inTitle && !inDesc && !inSeller) return false;
        }
        return true;
    });

    const firstName = user?.displayName?.split(' ')[0] || 'Estudiante';

    const renderSkeletons = () => {
        const skeletons = Array(8).fill(null);
        return (
            <View style={[styles.list, { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }]}>
                {skeletons.map((_, i) => (
                    <SkeletonCard key={`skel-${i}`} numColumns={numColumns} />
                ))}
            </View>
        );
    };

    if (user?.role === Role.ADMIN && !showMarketplace) {
        return (
            <View style={styles.root}>
                <View style={[styles.topBar, { paddingTop: insets.top + 10, paddingBottom: 10 }]}>
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
            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[isLargeScreen && styles.scrollContentWeb]}
            >
                <View style={[isLargeScreen && styles.mainContentWrapperWeb]}>
                    {/* Sticky top section - Refined for Web */}
                    <View style={[
                        styles.topBar,
                        { paddingTop: insets.top + (isLargeScreen ? 20 : 10) },
                        isLargeScreen && styles.topBarWeb
                    ]}>
                        {/* Branding row */}
                        <View style={styles.brandRow}>
                            <View style={styles.brandLeft}>
                                {!isLargeScreen && (
                                    <View style={styles.brandIconWrap}>
                                        <Ionicons name="storefront-outline" size={22} color={colors.textOnDark} />
                                    </View>
                                )}
                                <View>
                                    <Text style={[styles.brandTitle, isLargeScreen && styles.brandTitleWeb]}>
                                        {isLargeScreen ? 'Explorar Productos' : 'Marketplace'}
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <Ionicons name="hand-left-outline" size={11} color={isLargeScreen ? colors.textMuted : "rgba(255,255,255,0.6)"} />
                                        <Text style={[styles.greetingSmall, isLargeScreen && styles.greetingSmallWeb]}>Hola, {firstName}</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                {user?.role === Role.ADMIN && (
                                    <TouchableOpacity
                                        style={[styles.notificationBtn, isLargeScreen && styles.notificationBtnWeb]}
                                        onPress={() => setShowMarketplace(false)}
                                    >
                                        <Ionicons name="stats-chart" size={20} color={isLargeScreen ? colors.text : colors.textOnDark} />
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity
                                    style={[styles.notificationBtn, isLargeScreen && styles.notificationBtnWeb]}
                                    onPress={() => router.push('/notifications')}
                                >
                                    <Ionicons name="notifications-outline" size={22} color={isLargeScreen ? colors.text : colors.textOnDark} />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.profileHeaderBtn, isLargeScreen && styles.profileHeaderBtnWeb]}
                                    onPress={() => router.push('/(tabs)/profile')}
                                    activeOpacity={0.7}
                                >
                                    {user?.photoURL ? (
                                        <Image source={{ uri: user.photoURL }} style={styles.profileHeaderImage} />
                                    ) : (
                                        <View style={styles.profileHeaderFallback}>
                                            <Text style={styles.profileHeaderFallbackText}>
                                                {firstName.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                        {!isLargeScreen && <Text style={styles.greetingBig}>¿Qué buscas hoy?</Text>}
                    </View>

                    <View style={[styles.searchBarWrapper, isLargeScreen && styles.searchBarWrapperWeb]}>
                        <View style={[styles.searchBar, isLargeScreen && styles.searchBarWeb]}>
                            <Ionicons name="search-outline" size={20} color={colors.textMuted} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Buscar productos, vendedores, categorías..."
                                placeholderTextColor={colors.textMuted}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                returnKeyType="search"
                                autoCorrect={false}
                                clearButtonMode="while-editing"
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity
                                    onPress={() => setSearchQuery('')}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View style={[styles.categoriesSection, isLargeScreen && styles.categoriesSectionWeb]}>
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

                    {debouncedSearch.trim().length > 0 && !loading && (
                        <View style={styles.searchResultsBanner}>
                            <Text style={styles.searchResultsText}>
                                {filteredProducts.length === 0
                                    ? `Sin resultados para "${debouncedSearch.trim()}"`
                                    : `${filteredProducts.length} resultado${filteredProducts.length !== 1 ? 's' : ''} para "${debouncedSearch.trim()}"`}
                            </Text>
                        </View>
                    )}

                    {/* Products grid */}
                    <View style={styles.gridContainer}>
                        {loading ? (
                            renderSkeletons()
                        ) : filteredProducts.length === 0 ? (
                            <View style={styles.center}>
                                <Ionicons
                                    name={debouncedSearch.trim() ? 'search-outline' : 'file-tray-outline'}
                                    size={64}
                                    color={colors.border}
                                />
                                <Text style={styles.emptyTitle}>
                                    {debouncedSearch.trim() ? 'Sin resultados' : 'Sin productos aquí'}
                                </Text>
                                <Text style={styles.emptySubtitle}>
                                    {debouncedSearch.trim()
                                        ? 'Intenta con otro término de búsqueda o cambia la categoría.'
                                        : activeCategory !== 'Todos'
                                            ? `No hay productos en "${activeCategory}" aún.`
                                            : 'Sé el primero en publicar algo.'}
                                </Text>
                            </View>
                        ) : (
                            <View style={[styles.list, { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }]}>
                                {filteredProducts.map(item => (
                                    <ProductCard
                                        key={item.id}
                                        product={item}
                                        onPress={() => router.push(`/products/${item.id}`)}
                                        numColumns={numColumns}
                                    />
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContentWeb: {
        alignItems: 'center',
        paddingBottom: 40,
    },
    mainContentWrapperWeb: {
        width: '100%',
        maxWidth: 1400,
        paddingHorizontal: 20,
    },
    topBar: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 20,
        gap: 6,
    },
    topBarWeb: {
        backgroundColor: 'transparent',
        paddingHorizontal: 0,
        paddingBottom: 10,
    },
    brandRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 2,
    },
    brandLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    brandIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    brandTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: -0.3,
        lineHeight: 20,
    },
    brandTitleWeb: {
        color: colors.text,
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -0.8,
    },
    greetingSmall: {
        color: 'rgba(255,255,255,0.65)',
        fontSize: 11,
        fontWeight: '500',
    },
    greetingSmallWeb: {
        color: colors.textMuted,
        fontSize: 13,
    },
    greetingBig: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
        marginTop: 2,
        opacity: 0.9,
    },
    notificationBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationBtnWeb: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    profileHeaderBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    profileHeaderBtnWeb: {
        borderColor: colors.border,
    },
    profileHeaderImage: {
        width: '100%',
        height: '100%',
    },
    profileHeaderFallback: {
        width: '100%',
        height: '100%',
        backgroundColor: colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileHeaderFallbackText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
    searchBarWrapper: {
        backgroundColor: colors.primary,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    searchBarWrapperWeb: {
        backgroundColor: 'transparent',
        paddingHorizontal: 0,
        paddingBottom: 20,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: colors.surface,
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    searchBarWeb: {
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: colors.border,
        paddingVertical: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: colors.text,
        paddingVertical: 2,
    },
    searchResultsBanner: {
        backgroundColor: colors.infoLight,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        borderRadius: 12,
        marginBottom: 16,
    },
    searchResultsText: {
        ...typography.presets.caption,
        color: colors.info,
        fontWeight: '600',
    },
    categoriesSection: {
        backgroundColor: colors.surface,
        paddingTop: 12,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    categoriesSectionWeb: {
        backgroundColor: 'transparent',
        borderBottomWidth: 0,
        paddingTop: 0,
        marginBottom: 10,
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
        paddingHorizontal: 0,
        paddingBottom: 12,
        gap: 10,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 22,
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
        fontWeight: '600',
        color: colors.textSecondary,
    },
    chipTextActive: {
        color: '#fff',
        fontWeight: '700',
    },
    gridContainer: {
        marginTop: 10,
    },
    list: {
        paddingHorizontal: 0,
        paddingBottom: 20,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 60,
    },
    loadingText: {
        ...typography.presets.caption,
        color: colors.textMuted,
        marginTop: 8,
    },
    emptyTitle: {
        ...typography.presets.sectionTitle,
        color: colors.text,
        fontSize: 22,
        marginTop: 12,
    },
    emptySubtitle: {
        ...typography.presets.body,
        color: colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: 40,
        maxWidth: 400,
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
