import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    ActivityIndicator, TouchableOpacity, Alert, Share,
    useWindowDimensions, Image, Modal, FlatList, Platform,
} from 'react-native';
import { showAlert, showConfirm } from '@/utils/crossPlatformAlert';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '@/types/product';
import { Review } from '@/types/review';
import { getProductById, updateProductStatus } from '@/services/productService';
import { getOrCreateChat } from '@/services/chatService';
import { subscribeToSellerReviews, hasReviewed } from '@/services/reviewService';
import {
    createTransaction,
    getChatBuyersForProduct,
    getPendingTransaction,
    updateTransactionStatus,
} from '@/services/transactionService';
import { createReport } from '@/services/reportService';
import { createNotification } from '@/services/notificationService';
import { Transaction } from '@/types/transaction';
import { ReportReason, REPORT_REASON_LABELS } from '@/types/report';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { useAuth } from '@/context/AuthContext';
import { AppButton } from '@/components/ui/AppButton';
import { ReviewModal } from '@/components/ui/ReviewModal';

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

export default function ProductDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [alreadyReviewed, setAlreadyReviewed] = useState(false);
    // Buyer-picker modal for sell flow
    const [showBuyerModal, setShowBuyerModal] = useState(false);
    const [chatBuyers, setChatBuyers] = useState<Array<{ uid: string; name: string }>>([]);
    const [pendingTx, setPendingTx] = useState<Transaction | null>(null);
    const [confirmingTx, setConfirmingTx] = useState(false);
    // Report state
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState<ReportReason>('spam');
    const [reportSubmitting, setReportSubmitting] = useState(false);
    const router = useRouter();
    const { user } = useAuth();
    const { width } = useWindowDimensions();

    const isOwner = product?.sellerId === user?.id;
    const catColor = CATEGORY_COLORS[product?.category?.toLowerCase() ?? 'otros'] ?? '#4A5568';
    const conditionStyle = CONDITION_COLORS[product?.condition ?? 'good'];

    useEffect(() => {
        if (id) loadProduct(id);
    }, [id]);

    // Real-time reviews for the seller
    useEffect(() => {
        if (!product?.sellerId) return;
        return subscribeToSellerReviews(product.sellerId, setReviews);
    }, [product?.sellerId]);

    // Check if current user already reviewed this product
    useEffect(() => {
        if (!user || !product) return;
        hasReviewed(user.id, product.id).then(setAlreadyReviewed);
    }, [user, product?.id]);

    const loadProduct = async (productId: string) => {
        setLoading(true);
        const data = await getProductById(productId);
        setProduct(data ?? null);
        // If product is sold, check if current user is the buyer of a pending tx
        if (data && data.status === 'sold' && user && data.sellerId !== user.id) {
            getPendingTransaction(data.id, user.id).then(setPendingTx);
        }

        setLoading(false);
    };

    const handleMarkAsSold = async () => {
        if (!product || !user) return;

        // Fetch potential buyers from existing chats (gracefully handle errors)
        let buyers: Array<{ uid: string; name: string }> = [];
        try {
            buyers = await getChatBuyersForProduct(user.id, product.id);
        } catch (e) {
            console.warn('Could not fetch chat buyers:', e);
        }

        const doSell = async (buyerId?: string, buyerName?: string) => {
            setUpdatingStatus(true);
            try {
                const { success } = await updateProductStatus(product.id, 'sold');
                if (!success) {
                    Alert.alert('Error', 'No se pudo actualizar el estado. Inténtalo de nuevo.');
                    return;
                }
                setProduct(prev => prev ? { ...prev, status: 'sold' } : null);

                // Create transaction record if a buyer is identified
                if (buyerId && buyerName) {
                    await createTransaction({
                        productId: product.id,
                        productTitle: product.title,
                        productImage: product.images?.[0],
                        price: product.price,
                        sellerId: user.id,
                        sellerName: user.displayName,
                        buyerId,
                        buyerName,
                    });
                    // Notify the buyer
                    createNotification({
                        userId: buyerId,
                        type: 'sold',
                        title: '¡Tu compra fue confirmada!',
                        body: `El vendedor marcó "${product.title}" como vendido para ti.`,
                        relatedId: product.id,
                    });
                }

                // Show success message
                Alert.alert(
                    '¡Vendido!',
                    `"${product.title}" ha sido marcado como vendido exitosamente.${buyerName ? `\nComprador: ${buyerName}` : ''}`,
                    [{ text: 'OK' }]
                );
            } catch (e) {
                console.error('doSell error:', e);
                Alert.alert('Error', 'Ocurrió un error al marcar como vendido.');
            } finally {
                setUpdatingStatus(false);
            }
        };

        if (buyers.length === 0) {
            // No chat buyers — simple confirm
            const confirmed = await showConfirm(
                'Marcar como vendido',
                `¿Confirmas que "${product.title}" fue vendido?`,
                'Sí, vendido',
            );
            if (confirmed) doSell();
        } else {
            // Show buyer picker
            setChatBuyers(buyers);
            setShowBuyerModal(true);
        }
    };

    const handleConfirmTransaction = async () => {
        if (!pendingTx) return;

        const confirmed = await showConfirm(
            'Confirmar recepción',
            '¿Confirmas que recibiste este producto correctamente?',
            'Confirmar',
        );
        if (!confirmed) return;

        setConfirmingTx(true);
        const { success, error } = await updateTransactionStatus(pendingTx.id, 'completed');
        setConfirmingTx(false);

        if (success) {
            setPendingTx(null);
            // Notify the seller
            if (product) {
                createNotification({
                    userId: product.sellerId,
                    type: 'confirmed',
                    title: 'Compra confirmada',
                    body: `El comprador confirmó la recepción de "${product.title}".`,
                    relatedId: product.id,
                });
            }
            showAlert('¡Gracias!', 'Recepción confirmada. La transacción se marcó como completada.');
        } else {
            showAlert('Error', error ?? 'No se pudo confirmar la recepción');
        }
    };

    const handleShare = async () => {
        if (!product) return;
        await Share.share({
            title: product.title,
            message: `${product.title} — $${product.price.toFixed(2)} en Marketplace ITSUR`,
        });
    };

    const handleSubmitReport = async () => {
        if (!product || !user) return;
        setReportSubmitting(true);
        const { success, error } = await createReport({
            reporterId: user.id,
            reporterName: user.displayName,
            targetType: 'product',
            targetId: product.id,
            targetTitle: product.title,
            reason: reportReason,
        });
        setReportSubmitting(false);
        setShowReportModal(false);
        if (success) {
            showAlert('Reporte enviado', 'Gracias. Un administrador revisará tu reporte.');
        } else {
            showAlert('Error', error ?? 'No se pudo enviar el reporte');
        }
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
                <Ionicons name="search-outline" size={52} color={colors.border} />
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
                    {product.images?.[0] && (product.images[0].startsWith('data:') || product.images[0].startsWith('http')) ? (
                        <Image
                            source={{ uri: product.images[0] }}
                            style={styles.image}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={[styles.imageFallback, { backgroundColor: catColor }]}>
                            <Ionicons
                                name={getCategoryIcon(product.category)}
                                size={80}
                                color="rgba(255,255,255,0.9)"
                            />
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
                            <Ionicons name={getCategoryIcon(product.category)} size={12} color={catColor} />
                            <Text style={[styles.categoryText, { color: catColor }]}>
                                {product.category}
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
                            {(() => {
                                // Compute live avg from real-time reviews subscription
                                const liveRating = reviews.length > 0
                                    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
                                    : (product.sellerRating ?? null);
                                return liveRating != null ? (
                                    <View style={styles.ratingRow}>
                                        <Ionicons name="star" size={13} color={colors.accent} />
                                        <Text style={styles.ratingText}>
                                            {liveRating.toFixed(1)}
                                            {reviews.length > 0 && (
                                                <Text style={styles.ratingCount}> ({reviews.length})</Text>
                                            )}
                                        </Text>
                                    </View>
                                ) : null;
                            })()}
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
                        // Buyer actions — check for pending transaction
                        (product.status === 'sold' && pendingTx && pendingTx.status === 'pending') ? (
                            <View style={styles.confirmTxCard}>
                                <Text style={styles.confirmTxTitle}>¡Felicidades por tu compra!</Text>
                                <Text style={styles.confirmTxSub}>El vendedor marcó este producto como vendido para ti.</Text>
                                <AppButton
                                    title="Confirmar Recepción"
                                    onPress={handleConfirmTransaction}
                                    variant="accent"
                                    loading={confirmingTx}
                                    icon={<Ionicons name="gift-outline" size={18} color="#fff" />}
                                />
                            </View>
                        ) : (
                            // Buyer actions — active product or normal sold view
                            product.status === 'active' && (
                                <View style={styles.actionsCol}>
                                    <AppButton
                                        title="Contactar Vendedor"
                                        onPress={async () => {
                                            if (!user) return;
                                            const { chatId, error } = await getOrCreateChat({
                                                buyerId: user.id,
                                                buyerName: user.displayName,
                                                sellerId: product.sellerId,
                                                sellerName: product.sellerName,
                                                productId: product.id,
                                                productTitle: product.title,
                                                productImage: product.images?.[0],
                                                productPrice: product.price,
                                            });
                                            if (error || !chatId) {
                                                Alert.alert('Error', error ?? 'No se pudo abrir el chat');
                                                return;
                                            }
                                            router.push(`/chat/${chatId}`);
                                        }}
                                        icon={<Ionicons name="chatbubble-outline" size={18} color="#fff" />}
                                    />
                                    {!alreadyReviewed ? (
                                        <AppButton
                                            title="Calificar Vendedor"
                                            variant="secondary"
                                            onPress={() => setShowReviewModal(true)}
                                            icon={<Ionicons name="star-outline" size={18} color={colors.primary} />}
                                        />
                                    ) : (
                                        <View style={styles.reviewedBanner}>
                                            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                                            <Text style={styles.reviewedBannerText}>Ya calificaste a este vendedor</Text>
                                        </View>
                                    )}
                                </View>
                            )
                        )
                    )}

                    {/* ─── Report button (non-owners only) ─────────────── */}
                    {!isOwner && product.status === 'active' && user && (
                        <TouchableOpacity
                            style={styles.reportBtn}
                            onPress={() => setShowReportModal(true)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="flag-outline" size={14} color={colors.textMuted} />
                            <Text style={styles.reportBtnText}>Reportar publicación</Text>
                        </TouchableOpacity>
                    )}

                    {/* ─── Reviews section ──────────────────────────────── */}
                    {reviews.length > 0 && (
                        <View style={styles.reviewsSection}>
                            <View style={styles.divider} />
                            <View style={styles.reviewsHeader}>
                                <Ionicons name="star" size={17} color={colors.accent} />
                                <Text style={styles.reviewsTitle}>Reseñas del vendedor</Text>
                                <View style={styles.reviewCountBadge}>
                                    <Text style={styles.reviewCountText}>{reviews.length}</Text>
                                </View>
                            </View>
                            {reviews.slice(0, 5).map(r => (
                                <View key={r.id} style={styles.reviewCard}>
                                    <View style={styles.reviewCardHeader}>
                                        <View style={styles.reviewAvatar}>
                                            <Text style={styles.reviewAvatarText}>
                                                {r.reviewerName.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.reviewerName}>{r.reviewerName}</Text>
                                            <View style={styles.starsRow}>
                                                {([1, 2, 3, 4, 5] as const).map(n => (
                                                    <Ionicons
                                                        key={n}
                                                        name={n <= r.rating ? 'star' : 'star-outline'}
                                                        size={13}
                                                        color={n <= r.rating ? colors.accent : colors.border}
                                                    />
                                                ))}
                                            </View>
                                        </View>
                                        <Text style={styles.reviewDate}>
                                            {new Date(r.createdAt).toLocaleDateString('es-MX', { month: 'short', day: '2-digit' })}
                                        </Text>
                                    </View>
                                    <Text style={styles.reviewComment}>{r.comment}</Text>
                                    <View style={styles.reviewProductRow}>
                                        <Ionicons name="cube-outline" size={11} color={colors.textMuted} />
                                        <Text style={styles.reviewProductTag}>{r.productTitle}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Review modal */}
            {!isOwner && product && user && (
                <ReviewModal
                    visible={showReviewModal}
                    onClose={() => setShowReviewModal(false)}
                    onSuccess={() => {
                        setShowReviewModal(false);
                        setAlreadyReviewed(true);
                        Alert.alert('¡Gracias!', 'Tu reseña fue publicada exitosamente 🌟');
                    }}
                    sellerId={product.sellerId}
                    sellerName={product.sellerName}
                    reviewerId={user.id}
                    reviewerName={user.displayName}
                    productId={product.id}
                    productTitle={product.title}
                />
            )}

            {/* ─── Report Modal ─────────────────────────────────────── */}
            <Modal
                visible={showReportModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowReportModal(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.buyerSheet}>
                        <View style={styles.buyerSheetHandle} />
                        <Text style={styles.buyerSheetTitle}>Reportar publicación</Text>
                        <Text style={styles.buyerSheetSub}>Selecciona el motivo del reporte:</Text>
                        {(Object.keys(REPORT_REASON_LABELS) as ReportReason[]).map(r => (
                            <TouchableOpacity
                                key={r}
                                style={[styles.buyerRow, reportReason === r && styles.buyerRowActive]}
                                onPress={() => setReportReason(r)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.radioCircle, reportReason === r && styles.radioCircleActive]}>
                                    {reportReason === r && <View style={styles.radioInner} />}
                                </View>
                                <Text style={styles.buyerName}>{REPORT_REASON_LABELS[r]}</Text>
                            </TouchableOpacity>
                        ))}
                        <AppButton
                            title={reportSubmitting ? 'Enviando...' : 'Enviar Reporte'}
                            onPress={handleSubmitReport}
                            loading={reportSubmitting}
                            fullWidth
                        />
                        <AppButton
                            title="Cancelar"
                            variant="ghost"
                            onPress={() => setShowReportModal(false)}
                            fullWidth
                        />
                    </View>
                </View>
            </Modal>

            {/* ─── Buyer picker modal (sell flow) ─────────────────── */}
            <Modal
                visible={showBuyerModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowBuyerModal(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.buyerSheet}>
                        <View style={styles.buyerSheetHandle} />
                        <Text style={styles.buyerSheetTitle}>¿A quién le vendiste?</Text>
                        <Text style={styles.buyerSheetSub}>
                            Selecciona el comprador para registrar la transacción.
                        </Text>
                        <FlatList
                            data={chatBuyers}
                            keyExtractor={b => b.uid}
                            contentContainerStyle={{ gap: 8, paddingVertical: 12 }}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.buyerRow}
                                    onPress={() => {
                                        setShowBuyerModal(false);
                                        const doSellWithBuyer = async () => {
                                            if (!product || !user) return;
                                            setUpdatingStatus(true);
                                            const { success } = await updateProductStatus(product.id, 'sold');
                                            if (!success) {
                                                setUpdatingStatus(false);
                                                Alert.alert('Error', 'No se pudo actualizar el estado');
                                                return;
                                            }
                                            setProduct(prev => prev ? { ...prev, status: 'sold' } : null);
                                            await createTransaction({
                                                productId: product.id,
                                                productTitle: product.title,
                                                productImage: product.images?.[0],
                                                price: product.price,
                                                sellerId: user.id,
                                                sellerName: user.displayName,
                                                buyerId: item.uid,
                                                buyerName: item.name,
                                            });
                                            setUpdatingStatus(false);
                                            Alert.alert('Vendido', 'Transacción registrada correctamente');
                                        };
                                        doSellWithBuyer();
                                    }}
                                    activeOpacity={0.75}
                                >
                                    <View style={styles.buyerAvatar}>
                                        <Text style={styles.buyerAvatarText}>
                                            {item.name.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <Text style={styles.buyerName}>{item.name}</Text>
                                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity
                            style={styles.buyerSkipBtn}
                            onPress={() => {
                                setShowBuyerModal(false);
                                if (!product || !user) return;
                                updateProductStatus(product.id, 'sold').then(({ success }) => {
                                    if (success) setProduct(prev => prev ? { ...prev, status: 'sold' } : null);
                                });
                            }}
                        >
                            <Text style={styles.buyerSkipText}>Marcar como vendido sin registrar comprador</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24 },
    emptyTitle: { ...typography.presets.sectionTitle, color: colors.text },
    headerBtn: { padding: 4 },

    imageContainer: { width: '100%', backgroundColor: colors.backgroundAlt },
    image: { width: '100%', height: '100%' },
    imageFallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
    categoryPill: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
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
    ratingCount: { ...typography.presets.caption, color: colors.textMuted },

    actionsCol: { gap: 12 },
    soldBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.successLight, padding: 14, borderRadius: 12 },
    soldBannerText: { ...typography.presets.bodyMedium, color: colors.success },

    // ─── Reviewed banner ──────────────────────────────────────────────
    reviewedBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: colors.successLight,
        borderRadius: 10, padding: 12,
    },
    reviewedBannerText: { ...typography.presets.body, color: colors.success },

    // ─── Reviews section ──────────────────────────────────────────────
    reviewsSection: { marginTop: 4 },
    reviewsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    reviewsTitle: { ...typography.presets.sectionTitle, color: colors.text, flex: 1 },
    reviewCountBadge: {
        backgroundColor: colors.accent,
        borderRadius: 12, minWidth: 24, height: 24,
        justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6,
    },
    reviewCountText: { color: '#fff', fontSize: 12, fontWeight: '800' },

    reviewCard: {
        backgroundColor: colors.backgroundAlt,
        borderRadius: 12, padding: 14, marginBottom: 10,
        gap: 8,
    },
    reviewCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    reviewAvatar: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: colors.primary,
        justifyContent: 'center', alignItems: 'center',
        flexShrink: 0,
    },
    reviewAvatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    reviewerName: { ...typography.presets.bodyMedium, color: colors.text },
    starsRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
    reviewDate: { ...typography.presets.caption, color: colors.textMuted },
    reviewComment: { ...typography.presets.body, color: colors.text, lineHeight: 22 },
    reviewProductTag: { ...typography.presets.caption, color: colors.textMuted },
    reviewProductRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },

    // ─── Buyer picker modal ─────────────────────────────────────────────
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    buyerSheet: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        maxHeight: '70%',
    },
    buyerSheetHandle: {
        width: 40, height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    buyerSheetTitle: { ...typography.presets.sectionTitle, color: colors.text, marginBottom: 6 },
    buyerSheetSub: { ...typography.presets.caption, color: colors.textMuted, marginBottom: 4 },

    buyerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        backgroundColor: colors.backgroundAlt,
        borderRadius: 12,
    },
    buyerAvatar: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: colors.primary,
        justifyContent: 'center', alignItems: 'center',
        flexShrink: 0,
    },
    buyerAvatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    buyerName: { ...typography.presets.bodyMedium, color: colors.text, flex: 1 },

    buyerSkipBtn: { padding: 14, alignItems: 'center', marginTop: 4 },
    buyerSkipText: { ...typography.presets.caption, color: colors.textMuted, textDecorationLine: 'underline' },

    confirmTxCard: {
        backgroundColor: colors.accentLight,
        borderRadius: 16, padding: 20, gap: 10,
        borderWidth: 1, borderColor: colors.accent,
        marginBottom: 16,
    },
    confirmTxTitle: { ...typography.presets.sectionTitle, color: colors.accent, fontSize: 18 },
    confirmTxSub: { ...typography.presets.body, color: colors.textSecondary, marginBottom: 8 },

    // ─── Report styles ────────────────────────────────────────────────
    reportBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        marginTop: 8,
    },
    reportBtnText: {
        ...typography.presets.caption,
        color: colors.textMuted,
        fontWeight: '600',
    },
    buyerRowActive: {
        borderWidth: 1,
        borderColor: colors.primary,
        backgroundColor: colors.primary + '10',
    },
    radioCircle: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: colors.textMuted,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioCircleActive: {
        borderColor: colors.primary,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.primary,
    },
});
