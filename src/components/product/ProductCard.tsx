import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Product } from '@/types/product';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface ProductCardProps {
    product: Product;
    onPress: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <Image source={{ uri: product.images[0] }} style={styles.image} />
            <View style={styles.content}>
                <Text style={styles.title} numberOfLines={2}>{product.title}</Text>
                <Text style={styles.price}>${product.price.toFixed(2)}</Text>
                <Text style={styles.category}>{product.category}</Text>
                <View style={styles.footer}>
                    <Text style={styles.seller} numberOfLines={1}>Por: {product.sellerName}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: 8,
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        flex: 1, // For grid layout
        marginHorizontal: 4,
    },
    image: {
        width: '100%',
        height: 150,
        resizeMode: 'cover',
    },
    content: {
        padding: 12,
    },
    title: {
        fontSize: typography.sizes.md,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    price: {
        fontSize: typography.sizes.lg,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 4,
    },
    category: {
        fontSize: typography.sizes.xs,
        color: colors.textSecondary,
        marginBottom: 8,
        backgroundColor: colors.background,
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    footer: {
        marginTop: 4,
    },
    seller: {
        fontSize: typography.sizes.xs,
        color: colors.textSecondary,
    }
});
