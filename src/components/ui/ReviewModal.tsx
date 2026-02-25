/**
 * ReviewModal — Star-rating sheet that floats up from the bottom.
 * Used from the Product Detail screen when a buyer wants to rate a seller.
 */
import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Modal, TouchableOpacity,
    TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback,
    ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { addReview, AddReviewParams } from '@/services/reviewService';

interface Props {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    sellerId: string;
    sellerName: string;
    reviewerId: string;
    reviewerName: string;
    productId: string;
    productTitle: string;
}

export function ReviewModal({
    visible, onClose, onSuccess,
    sellerId, sellerName, reviewerId, reviewerName,
    productId, productTitle,
}: Props) {
    const [rating, setRating] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const reset = () => {
        setRating(0);
        setComment('');
        setError('');
        setLoading(false);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleSubmit = async () => {
        if (rating === 0) { setError('Selecciona una calificación'); return; }
        if (!comment.trim()) { setError('Escribe un comentario'); return; }
        setError('');
        setLoading(true);

        const params: AddReviewParams = {
            sellerId,
            reviewerId,
            reviewerName,
            rating: rating as 1 | 2 | 3 | 4 | 5,
            comment: comment.trim(),
            productId,
            productTitle,
        };

        const { success, error: err } = await addReview(params);
        setLoading(false);

        if (success) {
            reset();
            onSuccess();
        } else {
            setError(err ?? 'Error al guardar');
        }
    };

    const STAR_LABELS = ['', 'Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <TouchableWithoutFeedback onPress={handleClose}>
                <View style={styles.backdrop} />
            </TouchableWithoutFeedback>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.sheetWrapper}
                pointerEvents="box-none"
            >
                <View style={styles.sheet}>
                    {/* Handle */}
                    <View style={styles.handle} />

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Calificar Vendedor</Text>
                        <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                        {/* Seller + product info */}
                        <View style={styles.infoBox}>
                            <Ionicons name="person-circle-outline" size={20} color={colors.primary} />
                            <Text style={styles.infoText}>
                                <Text style={styles.infoBold}>{sellerName}</Text>
                                {'  ·  '}
                                <Text>{productTitle}</Text>
                            </Text>
                        </View>

                        {/* Star selector */}
                        <Text style={styles.label}>Tu calificación</Text>
                        <View style={styles.starsRow}>
                            {([1, 2, 3, 4, 5] as const).map(n => (
                                <TouchableOpacity
                                    key={n}
                                    onPress={() => setRating(n)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={n <= rating ? 'star' : 'star-outline'}
                                        size={36}
                                        color={n <= rating ? colors.accent : colors.border}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                        {rating > 0 && (
                            <Text style={styles.starLabel}>{STAR_LABELS[rating]}</Text>
                        )}

                        {/* Comment */}
                        <Text style={styles.label}>Comentario</Text>
                        <TextInput
                            style={styles.commentInput}
                            value={comment}
                            onChangeText={setComment}
                            placeholder="Describe tu experiencia con este vendedor..."
                            placeholderTextColor={colors.textMuted}
                            multiline
                            numberOfLines={4}
                            maxLength={400}
                            textAlignVertical="top"
                        />
                        <Text style={styles.charCount}>{comment.length}/400</Text>

                        {/* Error */}
                        {!!error && (
                            <View style={styles.errorRow}>
                                <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Submit */}
                        <TouchableOpacity
                            style={[styles.submitBtn, (loading || rating === 0) && styles.submitBtnDisabled]}
                            onPress={handleSubmit}
                            disabled={loading || rating === 0}
                            activeOpacity={0.8}
                        >
                            {loading
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <>
                                    <Ionicons name="star" size={18} color="#fff" />
                                    <Text style={styles.submitText}>Publicar Reseña</Text>
                                </>
                            }
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheetWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    sheet: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        maxHeight: '90%',
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: { ...typography.presets.sectionTitle, color: colors.text },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: colors.backgroundAlt,
        borderRadius: 10,
        padding: 12,
        marginBottom: 20,
    },
    infoText: { ...typography.presets.body, color: colors.textSecondary, flex: 1 },
    infoBold: { fontWeight: '700', color: colors.text },
    label: {
        ...typography.presets.label,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 10,
    },
    starsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 6,
    },
    starLabel: {
        ...typography.presets.bodyMedium,
        color: colors.accent,
        marginBottom: 20,
    },
    commentInput: {
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: colors.text,
        minHeight: 100,
        backgroundColor: colors.inputBg,
        marginBottom: 4,
    },
    charCount: {
        ...typography.presets.caption,
        color: colors.textMuted,
        textAlign: 'right',
        marginBottom: 16,
    },
    errorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    errorText: { ...typography.presets.caption, color: colors.error },
    submitBtn: {
        backgroundColor: colors.primary,
        borderRadius: 14,
        paddingVertical: 15,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    submitBtnDisabled: { opacity: 0.45 },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
