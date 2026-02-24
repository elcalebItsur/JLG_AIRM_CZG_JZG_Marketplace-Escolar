import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    ActivityIndicator, TouchableOpacity, Alert, Share,
    useWindowDimensions, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '@/types/product';
import { getProductById, updateProductStatus } from '@/services/productService';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { useAuth } from '@/context/AuthContext';
import { AppButton } from '@/components/ui/AppButton';

const CATEGORY_COLORS: Record<string, string> = {
    libros: '#2B6CB0', electronica: '#6B46C1', ropa: '#C05621',
    papeleria: '#276749', servicios: '#B7791F', otros: '#4A5568',
};

const CONDITION_LABELS: Record<string, string> = {
    new: 'Nuevo', like_new: 'Como Nuevo', good: 'Buen Estado', acceptable: 'Aceptable',
};

const CONDITION_COLORS: Record<string, { bg: string; text: string }> = {
    new: { bg: '#F0FFF4', text: '#276749' },
    like_new: { bg: '#EBF8FF', text: '#2B6CB0' },
    good: { bg: '#FFFFF0', text: '#B7791F' },
    acceptable: { bg: '#FFF5F5', text: '#C53030' },
};

function getCategoryEmoji(cat: string): string {
    const map: Record<string, string> = {
        libros: '📚', electronica: '💻', ropa: '👕',
        papeleria: '✏️', servicios: '🛠️', otros: '📦',
    };
    return map[cat] || '📦';
}

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const router = useRouter();
    const { user } = useAuth();
    const { width } = useWindowDimensions();

    const isOwner = product?.sellerId === user?.id;
    const catColor = CATEGORY_COLORS[product?.category?.toLowerCase() ?? 'otros'] ?? '#4A5568';
    const conditionStyle = CONDITION_COLORS[product?.condition ?? 'good'];

    useEffect(() => {
        if (id) loadProduct(id);
    }, [id]);

    const loadProduct = async (productId: string) => {
        setLoading(true);
        const data = await getProductById(productId);
        setProduct(data ?? null);
        setLoading(false);
    };

    const handleMarkAsSold = () => {
        if (!product) return;
        Alert.alert(
            'Marcar como vendido',
            '¿Confirmas que este producto ya fue vendido?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Confirmar', style: 'default',
                    onPress: async () => {
                        setUpdatingStatus(true);
                        const { success } = await updateProductStatus(product.id, 'sold');
                        setUpdatingStatus(false);
                        if (success) {
                            setProduct(prev => prev ? { ...prev, status: 'sold' } : null);
                        } else {
                            Alert.alert('Error', 'No se pudo actualizar el estado');
                        }
                    },
                },
            ]
        );
    };

    const handleShare = async () => {
        if (!product) return;
        await Share.share({
            title: product.title,
            message: `${product.title} — $${product.price.toFixed(2)} en Marketplace ITSUR`,
        });
    };

    // ─── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!product) {
        return (
            <View style={styles.center}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyTitle}>Producto no encontrado</Text>
                <AppButton title="Volver" onPress={() => router.back()} variant="secondary" fullWidth={false} />
            </View>
        );
    }

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <>
            <Stack.Screen
                options={{
                    title: product.title,
                    headerRight: () => (
                        <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
                            <Ionicons name="share-outline" size={22} color={colors.textOnDark} />
                        </TouchableOpacity>
                    ),
                }}
            />

            <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
                {/* Hero image */}
                <View style={[styles.imageContainer, { height: width * 0.75 }]}>
                    {product.images?.length > 0 ? (
                        <Image
                            source={{ uri: product.images[0] }}
                            style={styles.image}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={[styles.imageFallback, { backgroundColor: catColor }]}>
                            <Text style={styles.imageFallbackEmoji}>
                                {getCategoryEmoji(product.category)}
                            </Text>
                        </View>
                    )}
                    {/* Status overlay */}
                    {product.status === 'sold' && (
                        <View style={styles.soldOverlay}>
                            <Text style={styles.soldOverlayText}>VENDIDO</Text>
                        </View>
                    )}
                </View>

                <View style={styles.content}>
                    {/* Price + badges row */}
                    <View style={styles.priceBadgesRow}>
                        <Text style={styles.price}>${product.price.toFixed(2)}</Text>
                        <View style={[styles.conditionBadge, { backgroundColor: conditionStyle.bg }]}>
                            <Text style={[styles.conditionText, { color: conditionStyle.text }]}>
                                {CONDITION_LABELS[product.condition ?? 'good']}
                            </Text>
                        </View>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{product.title}</Text>

                    {/* Meta row */}
                    <View style={styles.metaRow}>
                        <View style={[styles.categoryPill, { backgroundColor: catColor + '20', borderColor: catColor + '50' }]}>
                            <Text style={[styles.categoryText, { color: catColor }]}>
                                {getCategoryEmoji(product.category)} {product.category}
                            </Text>
                        </View>
                        {product.location ? (
                            <View style={styles.locationRow}>
                                <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                                <Text style={styles.locationText}>{product.location}</Text>
                            </View>
                        ) : null}
                        <View style={styles.viewRow}>
                            <Ionicons name="eye-outline" size={13} color={colors.textMuted} />
                            <Text style={styles.viewText}>{product.viewCount ?? 0} vistas</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Description */}
                    <Text style={styles.sectionLabel}>Descripción</Text>
                    <Text style={styles.description}>{product.description}</Text>

                    <View style={styles.divider} />

                    {/* Seller card */}
                    <Text style={styles.sectionLabel}>Vendedor</Text>
                    <View style={styles.sellerCard}>
                        <View style={[styles.sellerAvatar, { backgroundColor: catColor }]}>
                            <Text style={styles.sellerAvatarText}>
                                {product.sellerName?.charAt(0)?.toUpperCase() ?? '?'}
                            </Text>
                        </View>
                        <View style={styles.sellerInfo}>
                            <Text style={styles.sellerName}>{product.sellerName}</Text>
                            {product.sellerRating != null && (
                                <View style={styles.ratingRow}>
                                    <Ionicons name="star" size={13} color={colors.accent} />
                                    <Text style={styles.ratingText}>
                                        {product.sellerRating.toFixed(1)}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Actions */}
                    {isOwner ? (
                        // Owner actions
                        <View style={styles.actionsCol}>
                            {product.status === 'active' && (
                                <AppButton
                                    title="Marcar como vendido"
                                    onPress={handleMarkAsSold}
                                    variant="secondary"
                                    loading={updatingStatus}
                                    icon={<Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />}
                                />
                            )}
                            {product.status === 'sold' && (
                                <View style={styles.soldBanner}>
                                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                                    <Text style={styles.soldBannerText}>Este producto ya fue vendido</Text>
                                </View>
                            )}
                        </View>
                    ) : (
                        // Buyer actions
                        product.status === 'active' && (
                            <AppButton
                                title="Contactar Vendedor"
                                onPress={() => {
                                    // TODO Phase 7: navigate to chat
                                    Alert.alert('Próximamente', 'El chat estará disponible en la siguiente fase 💬');
                                }}
                                icon={<Ionicons name="chatbubble-outline" size={18} color="#fff" />}
                            />
                        )
                    )}
                </View>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24 },
    emptyEmoji: { fontSize: 48 },
    emptyTitle: { ...typography.presets.sectionTitle, color: colors.text },
    headerBtn: { padding: 4 },

    imageContainer: { width: '100%', backgroundColor: colors.backgroundAlt },
    image: { width: '100%', height: '100%' },
    imageFallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    imageFallbackEmoji: { fontSize: 80 },
    soldOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    soldOverlayText: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: 4 },

    content: { padding: 20, paddingBottom: 40 },

    priceBadgesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    price: { fontSize: 28, fontWeight: '800', color: colors.primary },
    conditionBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
    conditionText: { fontSize: 12, fontWeight: '700' },

    title: { fontSize: 20, fontWeight: '700', color: colors.text, lineHeight: 28, marginBottom: 12 },

    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
    categoryPill: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    categoryText: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    locationText: { ...typography.presets.caption, color: colors.textMuted },
    viewRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    viewText: { ...typography.presets.caption, color: colors.textMuted },

    divider: { height: 1, backgroundColor: colors.border, marginVertical: 20 },

    sectionLabel: { ...typography.presets.label, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
    description: { ...typography.presets.body, color: colors.text, lineHeight: 24 },

    sellerCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    sellerAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    sellerAvatarText: { fontSize: 20, fontWeight: '700', color: '#fff' },
    sellerInfo: { flex: 1 },
    sellerName: { ...typography.presets.bodyMedium, color: colors.text },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    ratingText: { ...typography.presets.caption, color: colors.textSecondary },

    actionsCol: { gap: 12 },
    soldBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.successLight, padding: 14, borderRadius: 12 },
    soldBannerText: { ...typography.presets.bodyMedium, color: colors.success },
});
