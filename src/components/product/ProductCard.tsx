import React, { useRef } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    Animated,
    useWindowDimensions,
} from 'react-native';
import { Product } from '@/types/product';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { Ionicons } from '@expo/vector-icons';

interface ProductCardProps {
    product: Product;
    onPress: () => void;
    showStatus?: boolean;
    numColumns?: number;
}

const CATEGORY_COLORS: Record<string, string> = {
    libros: '#2B6CB0',
    electronica: '#6B46C1',
    ropa: '#C05621',
    papeleria: '#276749',
    servicios: '#B7791F',
    otros: '#4A5568',
};

export const ProductCard: React.FC<ProductCardProps> = ({ 
    product, 
    onPress, 
    showStatus = false,
    numColumns = 2
}) => {
    const scale = useRef(new Animated.Value(1)).current;
    const { width } = useWindowDimensions();

    // Responsive card width calculation
    const horizontalPadding = 24; // (list paddingHorizontal 12)*2
    const gap = 10;
    const cardWidth = (width - horizontalPadding - (numColumns - 1) * gap) / numColumns;

    const handlePressIn = () => {
        Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();
    };
    const handlePressOut = () => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
    };

    const categoryKey = product.category?.toLowerCase() || 'otros';
    const catColor = CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS['otros'];
    const imageUri = product.images?.[0];

    const statusColor = product.status === 'sold' ? colors.error : colors.success;
    const statusLabel = product.status === 'sold' ? 'Vendido' : 'Activo';

    return (
        <TouchableOpacity
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
        >
            <Animated.View style={[styles.card, { width: cardWidth, transform: [{ scale }] }]}>
                {/* Image / Fallback */}
                <View style={styles.imageContainer}>
                    {imageUri && (imageUri.startsWith('data:') || imageUri.startsWith('http')) ? (
                        <Image source={{ uri: imageUri }} style={styles.image} />
                    ) : (
                        <View style={[styles.imageFallback, { backgroundColor: catColor }]}>
                            <Ionicons
                                name={getCategoryIcon(categoryKey)}
                                size={44}
                                color="rgba(255,255,255,0.85)"
                            />
                        </View>
                    )}
                    {/* Price badge */}
                    <View style={styles.priceBadge}>
                        <Text style={styles.priceText}>${product.price.toFixed(2)}</Text>
                    </View>
                    {/* Status badge (only in My Products) */}
                    {showStatus && (
                        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                            <Text style={styles.statusText}>{statusLabel}</Text>
                        </View>
                    )}
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {/* Category pill */}
                    <View style={[styles.categoryPill, { backgroundColor: catColor + '20', borderColor: catColor + '40' }]}>
                        <Ionicons name={getCategoryIcon(categoryKey)} size={10} color={catColor} />
                        <Text style={[styles.categoryText, { color: catColor }]}>
                            {product.category}
                        </Text>
                    </View>

                    <Text style={styles.title} numberOfLines={2}>
                        {product.title}
                    </Text>

                    {/* Seller row */}
                    <View style={styles.sellerRow}>
                        <View style={[styles.sellerAvatar, { backgroundColor: catColor }]}>
                            <Text style={styles.sellerAvatarText}>
                                {product.sellerName?.charAt(0)?.toUpperCase() || '?'}
                            </Text>
                        </View>
                        <Text style={styles.sellerName} numberOfLines={1}>
                            {product.sellerName}
                        </Text>
                    </View>
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
};

function getCategoryIcon(cat: string): keyof typeof Ionicons.glyphMap {
    const map: Record<string, keyof typeof Ionicons.glyphMap> = {
        libros: 'book-outline',
        electronica: 'laptop-outline',
        ropa: 'shirt-outline',
        papeleria: 'pencil-outline',
        servicios: 'construct-outline',
        otros: 'cube-outline',
    };
    return map[cat] || 'cube-outline';
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        marginBottom: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
        height: 140,
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imageFallback: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },

    priceBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    priceText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    statusBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
    },
    statusText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    content: {
        padding: 10,
    },
    categoryPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 2,
        alignSelf: 'flex-start',
        marginBottom: 6,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    title: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.text,
        lineHeight: 18,
        marginBottom: 8,
    },
    sellerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    sellerAvatar: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sellerAvatarText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: '700',
    },
    sellerName: {
        flex: 1,
        fontSize: 11,
        color: colors.textSecondary,
    },
});
