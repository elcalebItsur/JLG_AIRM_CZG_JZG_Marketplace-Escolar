import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Product } from '@/types/product';
import { getMyProducts } from '@/services/productService';
import { ProductCard } from '@/components/product/ProductCard';
import { colors } from '@/theme/colors';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { useAuth } from '@/context/AuthContext';

export default function MyProductsScreen() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            loadMyProducts();
        }
    }, [user]);

    const loadMyProducts = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getMyProducts(user.id);
            setProducts(data);
        } catch (error) {
            console.error('Failed to load my products', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: Product }) => (
        <ProductCard
            product={item}
            onPress={() => { }} // TODO: Edit navigation
        />
    );

    return (
        <ScreenWrapper style={styles.container} safeArea={false}>
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : products.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyText}>No tienes publicaciones activas.</Text>
                </View>
            ) : (
                <FlatList
                    data={products}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    numColumns={2}
                    contentContainerStyle={styles.list}
                    columnWrapperStyle={styles.columnWrapper}
                    refreshing={loading}
                    onRefresh={loadMyProducts}
                />
            )}
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    list: {
        padding: 8,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: colors.textSecondary,
    },
});
