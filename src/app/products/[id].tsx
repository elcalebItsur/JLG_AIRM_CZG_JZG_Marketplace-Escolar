import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    ActivityIndicator, TouchableOpacity, Alert, Share,
    useWindowDimensions, Image, Modal, FlatList, Platform, Animated,
} from 'react-native';
import { showAlert, showConfirm } from '@/utils/crossPlatformAlert';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '@/types/product';
import { Review } from '@/types/review';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { getProductById, updateProductStatus, deleteProduct, subscribeToProductById, reduceProductStock } from '@/services/productService';
import { getOrCreateChat, sendMessage } from '@/services/chatService';
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
import { useToast } from '@/context/ToastContext';
import { AppButton } from '@/components/ui/AppButton';
import { ReviewModal } from '@/components/ui/ReviewModal';
import { UserAvatar } from '@/components/ui/UserAvatar';

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
    
    // Animation refs must be at the top level
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    
    const [isSharing, setIsSharing] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [alreadyReviewed, setAlreadyReviewed] = useState(false);
    // Buyer-picker modal for sell flow
    const [showBuyerModal, setShowBuyerModal] = useState(false);
    const [chatBuyers, setChatBuyers] = useState<Array<{ uid: string; name: string }>>([]);
    const [pendingTx, setPendingTx] = useState<Transaction | null>(null);
    const [confirmingTx, setConfirmingTx] = useState(false);
    const [saleQuantity, setSaleQuantity] = useState(1);
    // Report state
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState<ReportReason>('spam');
    const [reportSubmitting, setReportSubmitting] = useState(false);
    const router = useRouter();
    const { user } = useAuth();
    const { showToast } = useToast();
    const { width, height } = useWindowDimensions();

    const isDesktop = width > 900;
    const isOwner = product?.sellerId === user?.id;
    const catColor = CATEGORY_COLORS[product?.category?.toLowerCase() ?? 'otros'] ?? '#4A5568';
    const conditionStyle = CONDITION_COLORS[product?.condition ?? 'good'];

    useEffect(() => {
        if (!id) return;

        setLoading(true);
        
        // One-time fetch to increment view count
        getProductById(id).catch(() => console.error('getProductById failed'));

        // Subscription for real-time updates
        const unsubscribe = subscribeToProductById(id, (data) => {
            setProduct(data ?? null);
            
            // If product is sold, check if current user is the buyer of a pending tx
            if (data && data.status === 'sold' && user && data.sellerId !== user.id) {
                getPendingTransaction(data.id, user.id).then(setPendingTx);
            }
            
            setLoading(false);
        });

        return () => unsubscribe();
    }, [id, user]);

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

    useEffect(() => {
        if (!loading && product) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [loading, product]);

    const handleMarkAsSold = async () => {
        if (!product || !user) return;

        // Fetch potential buyers from existing chats (gracefully handle errors)
        let buyers: Array<{ uid: string; name: string }> = [];
        try {
            buyers = await getChatBuyersForProduct(user.id, product.id);
        } catch (e) {
            console.warn('Could not fetch chat buyers:', e);
        }

        if (buyers.length === 0) {
            // No chat buyers — prompt for quantity if stock > 1
            if ((product.stock ?? 1) > 1) {
                setChatBuyers([]);
                setShowBuyerModal(true);
            } else {
                const confirmed = await showConfirm(
                    'Marcar como vendido',
                    `¿Confirmas que "${product.title}" fue vendido?`,
                    'Sí, vendido',
                );
                if (confirmed) {
                    setSaleQuantity(1);
                    doSell();
                }
            }
        } else {
            // Show buyer picker
            setChatBuyers(buyers);
            setSaleQuantity(1);
            setShowBuyerModal(true);
        }
    };

    const doSell = async (buyerId?: string, buyerName?: string) => {
        if (!product || !user) return;
        setUpdatingStatus(true);
        try {
            // 1. Reduce stock
            const { success: stockSuccess, error: stockError } = await reduceProductStock(product.id, saleQuantity);
            
            if (!stockSuccess) {
                showAlert('Error', stockError || 'No se pudo actualizar el stock.');
                return;
            }

            // Create transaction record
            await createTransaction({
                productId: product.id,
                productTitle: product.title,
                productImage: product.images?.[0],
                price: product.price,
                sellerId: user.id,
                sellerName: user.displayName,
                buyerId: buyerId ?? 'anonymous',
                buyerName: buyerName ?? 'Comprador externo',
                quantity: saleQuantity,
            });

            // Notify the buyer if identified
            if (buyerId) {
                createNotification({
                    userId: buyerId,
                    type: 'sold',
                    title: '¡Tu compra fue confirmada!',
                    body: `El vendedor marcó ${saleQuantity > 1 ? `${saleQuantity} unidades de` : ''} "${product.title}" como vendido para ti.`,
                    relatedId: product.id,
                });
            }

            // Show success message
            showAlert(
                '¡Venta registrada!',
                `Has vendido ${saleQuantity} unidad(es) de "${product.title}".${buyerName ? `\nComprador: ${buyerName}` : ''}`
            );
            setSaleQuantity(1); // Reset
        } catch (e) {
            console.error('doSell error');
            showAlert('Error', 'Ocurrió un error al marcar como vendido.');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleDeleteProduct = async () => {
        if (!product) return;
        const confirmed = await showConfirm(
            'Eliminar publicación',
            '¿Estás seguro de que deseas eliminar permanentemente esta publicación? Esta acción no se puede deshacer.',
            'Eliminar',
            'No, cancelar'
        );

        if (!confirmed) return;

        setUpdatingStatus(true);
        const { success, error } = await deleteProduct(product.id);
        setUpdatingStatus(false);

        if (success) {
            showAlert('Publicación eliminada', 'Tu producto ha sido eliminado del marketplace.', () => {
                router.replace('/');
            });
        } else {
            showAlert('Error', error ?? 'No se pudo eliminar el producto');
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
            showToast('Reporte enviado', 'success');
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

            <View style={[styles.root, isDesktop && styles.rootDesktop]}>
                {/* 1. Left Column: Image Carousel (on Desktop) or Top Hero (on Mobile) */}
                <View style={[styles.imageContainer, isDesktop ? styles.imageContainerDesktop : { height: width * 0.75 }]}>
                    {product.images && product.images.length > 0 ? (
                        <>
                            <FlatList
                                data={product.images}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(item, index) => `img-${index}`}
                                onScroll={(e) => {
                                    const offset = e.nativeEvent.contentOffset.x;
                                    const index = Math.round(offset / (isDesktop ? 600 : width));
                                    setActiveImageIndex(index);
                                }}
                                renderItem={({ item }) => (
                                    <View style={{ width: isDesktop ? 600 : width, height: '100%' }}>
                                        <Image
                                            source={{ uri: item }}
                                            style={styles.image}
                                            resizeMode="contain"
                                        />
                                    </View>
                                )}
                            />
                            {/* Pagination Indicators */}
                            {product.images.length > 1 && (
                                <View style={styles.pagination}>
                                    {product.images.map((_, i) => (
                                        <View 
                                            key={i} 
                                            style={[
                                                styles.paginationDot, 
                                                activeImageIndex === i && styles.paginationDotActive
                                            ]} 
                                        />
                                    ))}
                                </View>
                            )}
                        </>
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

                {/* 2. Right Column: Details (Scrollable on Desktop) */}
                <ScrollView 
                    style={isDesktop ? styles.contentDesktop : styles.scrollView} 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={isDesktop ? styles.scrollContentDesktop : undefined}
                >
                    <Animated.View style={[
                        styles.content,
                        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                    ]}>
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
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionLabel}>Descripción</Text>
                        <Text style={styles.description}>{product.description}</Text>
                    </View>

                    <View style={styles.divider} />

                    {/* Seller details */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionLabel}>Vendedor</Text>
                        <View style={styles.sellerCard}>
                            <UserAvatar 
                                userId={product.sellerId} 
                                userName={product.sellerName} 
                                size={48} 
                            />
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
                    </View>

                    <View style={styles.divider} />

                    {/* Actions */}
                    {isOwner ? (
                        // Owner actions
                        <View style={styles.actionsCol}>
                            {product.status === 'active' && (
                                <>
                                    <AppButton
                                        title={(product.stock ?? 1) > 1 ? "Marcar venta" : "Marcar como vendido"}
                                        onPress={handleMarkAsSold}
                                        variant="secondary"
                                        loading={updatingStatus}
                                        icon={<Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />}
                                    />
                                    <View style={styles.ownerActionsGrid}>
                                        <TouchableOpacity 
                                            style={[styles.ownerActionBtn, { borderColor: colors.primary }]}
                                            onPress={() => router.push(`/products/edit/${product.id}`)}
                                        >
                                            <Ionicons name="create-outline" size={18} color={colors.primary} />
                                            <Text style={[styles.ownerActionText, { color: colors.primary }]}>Editar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={[styles.ownerActionBtn, { borderColor: colors.error }]}
                                            onPress={handleDeleteProduct}
                                        >
                                            <Ionicons name="trash-outline" size={18} color={colors.error} />
                                            <Text style={[styles.ownerActionText, { color: colors.error }]}>Eliminar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
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
                                            
                                            // Fetch seller photo for synchronization
                                            let sellerPhoto: string | null = null;
                                            try {
                                                const sellerDoc = await getDoc(doc(db, 'users', product.sellerId));
                                                if (sellerDoc.exists()) {
                                                    sellerPhoto = sellerDoc.data().photoURL || null;
                                                }
                                            } catch (e) {
                                                console.error("Error fetching seller photo");
                                            }

                                            const { chatId, isNew, error } = await getOrCreateChat({
                                                buyerId: user.id,
                                                buyerName: user.displayName,
                                                buyerPhoto: user.photoURL,
                                                sellerId: product.sellerId,
                                                sellerName: product.sellerName,
                                                sellerPhoto: sellerPhoto,
                                                productId: product.id,
                                                productTitle: product.title,
                                                productImage: product.images?.[0],
                                                productPrice: product.price,
                                            });
                                            if (error || !chatId) {
                                                Alert.alert('Error', error ?? 'No se pudo abrir el chat');
                                                return;
                                            }

                                            // Automatically send interest message if it's a new conversation
                                            if (isNew) {
                                                await sendMessage(
                                                    chatId,
                                                    user.id,
                                                    user.displayName,
                                                    `¡Hola! Me interesa tu producto: "${product.title}"`,
                                                    user.photoURL
                                                );
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
                            {reviews.slice(0, 5).map(review => (
                                <View key={review.id} style={styles.reviewCard}>
                                    <View style={styles.reviewCardHeader}>
                                        <UserAvatar 
                                            userId={review.reviewerId} 
                                            userName={review.reviewerName} 
                                            size={36} 
                                        />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.reviewerName}>{review.reviewerName}</Text>
                                            <View style={styles.starsRow}>
                                                {([1, 2, 3, 4, 5] as const).map(n => (
                                                    <Ionicons
                                                        key={n}
                                                        name={n <= review.rating ? 'star' : 'star-outline'}
                                                        size={13}
                                                        color={n <= review.rating ? colors.accent : colors.border}
                                                    />
                                                ))}
                                            </View>
                                        </View>
                                        <Text style={styles.reviewDate}>
                                            {new Date(review.createdAt).toLocaleDateString('es-MX', { month: 'short', day: '2-digit' })}
                                        </Text>
                                    </View>
                                    <Text style={styles.reviewComment}>{review.comment}</Text>
                                    <View style={styles.reviewProductRow}>
                                        <Ionicons name="cube-outline" size={11} color={colors.textMuted} />
                                        <Text style={styles.reviewProductTag}>{review.productTitle}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                    </Animated.View>
                </ScrollView>
        </View>

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
                animationType="fade"
                onRequestClose={() => setShowBuyerModal(false)}
            >
                <TouchableOpacity 
                    style={styles.modalBackdrop} 
                    activeOpacity={1} 
                    onPress={() => setShowBuyerModal(false)}
                >
                    <TouchableOpacity 
                        activeOpacity={1} 
                        style={styles.buyerSheet}
                        onPress={e => e.stopPropagation()} 
                    >
                        <View style={styles.buyerSheetHandle} />
                        <Text style={styles.buyerSheetTitle}>
                            {(product.stock ?? 1) > 1 ? 'Registrar venta' : '¿A quién le vendiste?'}
                        </Text>
                        
                        {/* Quantity Selector if stock > 1 */}
                        {(product.stock ?? 1) > 1 && (
                            <View style={styles.quantitySection}>
                                <Text style={styles.buyerSheetSub}>Cantidad a vender:</Text>
                                <View style={styles.qtyControls}>
                                    <TouchableOpacity 
                                        style={styles.qtyBtn} 
                                        onPress={() => setSaleQuantity(q => Math.max(1, q - 1))}
                                    >
                                        <Ionicons name="remove" size={20} color={colors.primary} />
                                    </TouchableOpacity>
                                    <Text style={styles.qtyText}>{saleQuantity}</Text>
                                    <TouchableOpacity 
                                        style={styles.qtyBtn} 
                                        onPress={() => setSaleQuantity(q => Math.min(product.stock ?? 1, q + 1))}
                                    >
                                        <Ionicons name="add" size={20} color={colors.primary} />
                                    </TouchableOpacity>
                                    <Text style={styles.qtyAvailable}>de {product.stock} disponibles</Text>
                                </View>
                            </View>
                        )}

                        <Text style={styles.buyerSheetSub}>
                            {chatBuyers.length > 0 
                                ? 'Selecciona al comprador de tus chats:' 
                                : 'No hay chats recientes para este producto.'}
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
                                        doSell(item.uid, item.name);
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
                            onPress={async () => {
                                setShowBuyerModal(false);
                                if (!product || !user) return;
                                const confirmed = await showConfirm(
                                    'Confirmar venta',
                                    `¿Confirmas la venta de ${saleQuantity} unidad(es) sin registrar comprador?`,
                                    'Confirmar venta'
                                );
                                if (confirmed) {
                                    setUpdatingStatus(true);
                                    const { success } = await reduceProductStock(product.id, saleQuantity);
                                    if (success) {
                                        await createTransaction({
                                            productId: product.id,
                                            productTitle: product.title,
                                            productImage: product.images?.[0],
                                            price: product.price,
                                            sellerId: user.id,
                                            sellerName: user.displayName,
                                            buyerId: 'anonymous',
                                            buyerName: 'Comprador externo',
                                            quantity: saleQuantity,
                                        });
                                        showAlert('Venta registrada', 'Stock actualizado correctamente.');
                                    }
                                    setUpdatingStatus(false);
                                }
                            }}
                        >
                            <Text style={styles.buyerSkipText}>Marcar venta sin registrar comprador</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

        </>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    rootDesktop: { flexDirection: 'row', padding: 20, gap: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 24 },
    emptyTitle: { ...typography.presets.sectionTitle, color: colors.text },
    headerBtn: { padding: 4 },

    scrollView: { flex: 1 },
    contentDesktop: { flex: 1, backgroundColor: colors.surface, borderRadius: 20, overflow: 'hidden' },
    scrollContentDesktop: { paddingBottom: 40 },

    imageContainer: { width: '100%', backgroundColor: colors.backgroundAlt },
    imageContainerDesktop: { width: '45%', height: '100%', borderRadius: 20, overflow: 'hidden' },
    image: { width: '100%', height: '100%' },
    pagination: {
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.4)',
    },
    paginationDotActive: {
        backgroundColor: '#fff',
        width: 20,
    },
    imageFallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    soldOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    soldOverlayText: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: 4 },

    content: { padding: 20, paddingBottom: 40 },
    sectionContainer: { marginBottom: 4 },

    priceBadgesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    price: { fontSize: 32, fontWeight: '900', color: colors.primary, letterSpacing: -0.5 },
    conditionBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    conditionText: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase' },

    title: { fontSize: 24, fontWeight: '800', color: colors.text, lineHeight: 32, marginBottom: 16 },

    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
    categoryPill: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 6 },
    categoryText: { fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    locationText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
    viewRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    viewText: { fontSize: 13, color: colors.textMuted },

    divider: { height: 1.5, backgroundColor: colors.border, marginVertical: 24, opacity: 0.6 },

    sectionLabel: { ...typography.presets.label, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 14, fontWeight: '800' },
    description: { ...typography.presets.body, color: colors.text, lineHeight: 26, fontSize: 16 },

    sellerCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    sellerAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    sellerAvatarText: { fontSize: 20, fontWeight: '700', color: '#fff' },
    sellerInfo: { flex: 1 },
    sellerName: { ...typography.presets.bodyMedium, color: colors.text },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    ratingText: { ...typography.presets.caption, color: colors.textSecondary },
    ratingCount: { ...typography.presets.caption, color: colors.textMuted },

    actionsCol: { gap: 12 },
    ownerActionsGrid: { flexDirection: 'row', gap: 10, marginTop: 4 },
    ownerActionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
    },
    ownerActionText: {
        fontSize: 14,
        fontWeight: '700',
    },
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

    // ─── Quantity selector ─────────────────────────────────────────────
    quantitySection: {
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    qtyControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginTop: 8,
    },
    qtyBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.backgroundAlt,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    qtyText: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.text,
        minWidth: 30,
        textAlign: 'center',
    },
    qtyAvailable: {
        ...typography.presets.caption,
        color: colors.textMuted,
        marginLeft: 4,
    },
});
