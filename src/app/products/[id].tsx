import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Button, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Product } from '@/types/product';
import { getProductById } from '@/services/productService';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

export default function ProductDetailsScreen() {
    const { id } = useLocalSearchParams();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (typeof id === 'string') {
            loadProduct(id);
        }
    }, [id]);

    const loadProduct = async (productId: string) => {
        setLoading(true);
        const data = await getProductById(productId);
        setProduct(data || null);
        setLoading(false);
    };

    const handleContact = () => {
        Alert.alert('Contacto', `Contactar a ${product?.sellerName} via correo institucional.`);
    };

    if (loading) {
        return (
            <ScreenWrapper style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </ScreenWrapper>
        );
    }

    if (!product) {
        return (
            <ScreenWrapper style={styles.center}>
                <Text>Producto no encontrado</Text>
                <Button title="Volver" onPress={() => router.back()} />
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.container}>
                <Image source={{ uri: product.images[0] }} style={styles.image} />

                <View style={styles.content}>
                    <Text style={styles.title}>{product.title}</Text>
                    <Text style={styles.price}>${product.price.toFixed(2)}</Text>

                    <View style={styles.badgeContainer}>
                        <Text style={styles.badge}>{product.category}</Text>
                        <Text style={[styles.badge, styles.statusBadge]}>{product.status === 'active' ? 'Disponible' : 'Vendido'}</Text>
                    </View>

                    <Text style={styles.sectionTitle}>Descripción</Text>
                    <Text style={styles.description}>{product.description}</Text>

                    <Text style={styles.sectionTitle}>Vendedor</Text>
                    <Text style={styles.seller}>{product.sellerName}</Text>

                    <View style={styles.footer}>
                        <Button title="Contactar Vendedor" color={colors.primary} onPress={handleContact} />
                    </View>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingBottom: 40,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: 300,
        resizeMode: 'cover',
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: typography.sizes.xxl,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 8,
    },
    price: {
        fontSize: typography.sizes.xl,
        fontWeight: 'bold',
        color: colors.secondary, // Gold for price
        marginBottom: 16,
    },
    badgeContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    badge: {
        backgroundColor: colors.background,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
        fontSize: typography.sizes.xs,
    },
    statusBadge: {
        backgroundColor: '#E8F5E9',
        color: '#2E7D32',
    },
    sectionTitle: {
        fontSize: typography.sizes.lg,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    description: {
        fontSize: typography.sizes.md,
        color: colors.textSecondary,
        lineHeight: 24,
    },
    seller: {
        fontSize: typography.sizes.md,
    },
    footer: {
        marginTop: 40,
    }
});
