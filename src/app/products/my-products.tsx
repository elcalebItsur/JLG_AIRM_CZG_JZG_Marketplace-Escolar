import React, { useEffect, useState } from 'react';
import {
    View, FlatList, StyleSheet, ActivityIndicator,
    Text, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Product } from '@/types/product';
import { getMyProducts } from '@/services/productService';
import { ProductCard } from '@/components/product/ProductCard';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { useAuth } from '@/context/AuthContext';

export default function MyProductsScreen() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) loadMyProducts();
    }, [user]);

    const loadMyProducts = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getMyProducts(user.id);
            setProducts(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadMyProducts();
        setRefreshing(false);
    };

    return (
        <View style={styles.root}>
            {/* Summary bar */}
            <View style={styles.summaryBar}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{products.length}</Text>
                    <Text style={styles.summaryLabel}>Total</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>
                        {products.filter(p => p.status === 'active' || !p.status).length}
                    </Text>
                    <Text style={styles.summaryLabel}>Activos</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>
                        {products.filter(p => p.status === 'sold').length}
                    </Text>
                    <Text style={styles.summaryLabel}>Vendidos</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Cargando tus publicaciones...</Text>
                </View>
            ) : products.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyEmoji}>📋</Text>
                    <Text style={styles.emptyTitle}>Sin publicaciones</Text>
                    <Text style={styles.emptySubtitle}>
                        Aún no has publicado ningún producto.
                    </Text>
                    <TouchableOpacity
                        style={styles.publishCTA}
                        onPress={() => router.push('/(tabs)/publish')}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add-circle-outline" size={18} color="#fff" />
                        <Text style={styles.publishCTAText}>Publicar ahora</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={products}
                    renderItem={({ item }) => (
                        <ProductCard
                            product={item}
                            showStatus
                            onPress={() => console.log('edit:', item.id)}
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
    summaryBar: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        paddingVertical: 16,
        justifyContent: 'space-around',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    summaryItem: { alignItems: 'center' },
    summaryValue: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.primary,
    },
    summaryLabel: {
        ...typography.presets.caption,
        color: colors.textSecondary,
        marginTop: 2,
    },
    list: {
        paddingHorizontal: 12,
        paddingTop: 14,
        paddingBottom: 24,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    loadingText: {
        ...typography.presets.caption,
        color: colors.textMuted,
        marginTop: 8,
    },
    emptyEmoji: { fontSize: 52 },
    emptyTitle: {
        ...typography.presets.sectionTitle,
        color: colors.text,
    },
    emptySubtitle: {
        ...typography.presets.body,
        color: colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    publishCTA: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 8,
    },
    publishCTAText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
});
