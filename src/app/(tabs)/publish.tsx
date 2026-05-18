import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, KeyboardAvoidingView, Platform, TextInput,
    Image, ActivityIndicator, useWindowDimensions,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showAlert, showConfirm, showImageSourcePicker } from '@/utils/crossPlatformAlert';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { ComponentProps } from 'react';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { getSafeTopInset, getSafeBottomInset } from '@/utils/pwa';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { createProduct } from '@/services/productService';
import { useAuth } from '@/context/AuthContext';
import { ProductCondition } from '@/types/product';

const CATEGORIES: { key: string; label: string; icon: ComponentProps<typeof Ionicons>['name'] }[] = [
    { key: 'libros', label: 'Libros', icon: 'book-outline' },
    { key: 'electronica', label: 'Electrónica', icon: 'laptop-outline' },
    { key: 'ropa', label: 'Ropa', icon: 'shirt-outline' },
    { key: 'papeleria', label: 'Papelería', icon: 'pencil-outline' },
    { key: 'servicios', label: 'Servicios', icon: 'construct-outline' },
    { key: 'otros', label: 'Otros', icon: 'cube-outline' },
];

const CONDITIONS: { key: ProductCondition; label: string; desc: string }[] = [
    { key: 'new', label: 'Nuevo', desc: 'Sin uso, empaquetado' },
    { key: 'like_new', label: 'Como nuevo', desc: 'Poco uso, perfecto estado' },
    { key: 'good', label: 'Bueno', desc: 'Uso normal, funciona bien' },
    { key: 'acceptable', label: 'Aceptable', desc: 'Uso evidente, funcional' },
];

export default function PublishScreen() {
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedCondition, setSelectedCondition] = useState<ProductCondition>('good');
    const [stock, setStock] = useState('1');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

    const priceRef = useRef<TextInput>(null);
    const stockRef = useRef<TextInput>(null);
    const locationRef = useRef<TextInput>(null);
    const descriptionRef = useRef<TextInput>(null);

    // ─── Permissions ────────────────────────────────────────────────────
    const requestCameraPermission = async (): Promise<boolean> => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permiso requerido',
                'Se necesita acceso a la cámara para tomar fotos de tus productos. Ve a Configuración para habilitarlo.',
            );
            return false;
        }
        return true;
    };

    const requestGalleryPermission = async (): Promise<boolean> => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permiso requerido',
                'Se necesita acceso a tu galería para seleccionar fotos. Ve a Configuración para habilitarlo.',
            );
            return false;
        }
        return true;
    };

    // ─── Image picking ──────────────────────────────────────────────────
    const pickFromGallery = async () => {
        const granted = await requestGalleryPermission();
        if (!granted) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const granted = await requestCameraPermission();
        if (!granted) return;

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleImagePress = () => {
        showImageSourcePicker(takePhoto, pickFromGallery);
    };

    const handleRemoveImage = () => {
        setImageUri(null);
    };

    // ─── Publish ────────────────────────────────────────────────────────
    const handlePublish = async () => {
        if (!title || !price || !description || !selectedCategory) {
            showAlert('Campos vacíos', 'Por favor completa todos los campos requeridos.');
            return;
        }
        if (!user) {
            showAlert('Error', 'Debes iniciar sesión para publicar');
            return;
        }

        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            showAlert('Precio inválido', 'Ingresa un precio válido mayor a 0');
            return;
        }

        const parsedStock = parseInt(stock);
        if (isNaN(parsedStock) || parsedStock <= 0) {
            showAlert('Stock inválido', 'La cantidad disponible debe ser al menos 1');
            return;
        }

        // ── Confirmation dialog (works on web + native) ──
        const confirmed = await showConfirm(
            'Confirmar publicación',
            `¿Deseas publicar "${title}" por $${parsedPrice.toFixed(2)}?`,
            'Publicar',
        );
        if (!confirmed) return;

        setLoading(true);
        const { success, error } = await createProduct({
            title,
            price: parsedPrice,
            description,
            category: selectedCategory,
            condition: selectedCondition,
            stock: parsedStock,
            location: location.trim() || undefined,
            images: imageUri ? [imageUri] : [],
            sellerId: user.id,
            sellerName: user.displayName,
            sellerRating: 0,
            isFeatured: false,
        });
        setLoading(false);

        if (success) {
            // Reset form
            setTitle(''); setPrice(''); setDescription('');
            setLocation(''); setSelectedCategory('');
            setSelectedCondition('good'); setStock('1'); setImageUri(null);

            // Show success and navigate
            showAlert(
                '¡Producto publicado!',
                'Tu producto ya está visible en el marketplace para toda la comunidad ITSUR.',
                () => router.push('/'),
            );
        } else {
            showAlert('Error', error || 'No se pudo publicar el producto. Inténtalo de nuevo.');
        }
    };

    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isMobileWeb = Platform.OS === 'web' && width <= 800;

    return (
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    {
                        paddingTop: getSafeTopInset(insets.top) + 16,
                        paddingBottom: isMobileWeb ? (70 + getSafeBottomInset(insets.bottom)) : Math.max(insets.bottom + 80, 100)
                    }
                ]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* ── Image upload ─────────────────────────────────── */}
                {imageUri ? (
                    <View style={styles.imagePreviewWrap}>
                        <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                        <TouchableOpacity
                            style={styles.removeImageBtn}
                            onPress={handleRemoveImage}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="close-circle" size={28} color={colors.error} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.changeImageBtn}
                            onPress={handleImagePress}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="camera-outline" size={16} color="#fff" />
                            <Text style={styles.changeImageText}>Cambiar</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.imageUpload} activeOpacity={0.7} onPress={handleImagePress}>
                        <View style={styles.imageUploadInner}>
                            <Ionicons name="camera-outline" size={36} color={colors.textMuted} />
                            <Text style={styles.imageUploadTitle}>Agregar foto</Text>
                            <Text style={styles.imageUploadSub}>Toca para tomar o seleccionar (1 por producto)</Text>
                        </View>
                    </TouchableOpacity>
                )}

                {/* ── Details ──────────────────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Detalles del producto</Text>

                    <AppInput
                        label="Título *"
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Ej. Libro de Cálculo Diferencial"
                        leftIcon={<Ionicons name="pricetag-outline" size={18} color={colors.textMuted} />}
                        returnKeyType="next"
                        onSubmitEditing={() => priceRef.current?.focus()}
                        blurOnSubmit={false}
                    />

                    <AppInput
                        ref={priceRef}
                        label="Precio (MXN) *"
                        value={price}
                        onChangeText={setPrice}
                        placeholder="0.00"
                        keyboardType="numeric"
                        leftIcon={<Text style={styles.currencyIcon}>$</Text>}
                        returnKeyType="next"
                        onSubmitEditing={() => stockRef.current?.focus()}
                        blurOnSubmit={false}
                    />

                    <AppInput
                        ref={stockRef}
                        label="Stock / Unidades disponibles *"
                        value={stock}
                        onChangeText={setStock}
                        placeholder="1"
                        keyboardType="numeric"
                        leftIcon={<Ionicons name="layers-outline" size={18} color={colors.textMuted} />}
                        returnKeyType="next"
                        onSubmitEditing={() => locationRef.current?.focus()}
                        blurOnSubmit={false}
                    />

                    <AppInput
                        ref={locationRef}
                        label="Ubicación (opcional)"
                        value={location}
                        onChangeText={setLocation}
                        placeholder="Ej. Edificio A, Biblioteca"
                        leftIcon={<Ionicons name="location-outline" size={18} color={colors.textMuted} />}
                        returnKeyType="next"
                        onSubmitEditing={() => descriptionRef.current?.focus()}
                        blurOnSubmit={false}
                    />
                </View>

                {/* ── Condition ─────────────────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Condición</Text>
                    <View style={styles.conditionGrid}>
                        {CONDITIONS.map(cond => (
                            <TouchableOpacity
                                key={cond.key}
                                style={[
                                    styles.conditionChip,
                                    selectedCondition === cond.key && styles.conditionChipActive,
                                ]}
                                onPress={() => setSelectedCondition(cond.key)}
                                activeOpacity={0.75}
                            >
                                <Text style={[
                                    styles.conditionLabel,
                                    selectedCondition === cond.key && styles.conditionLabelActive,
                                ]}>
                                    {cond.label}
                                </Text>
                                <Text style={styles.conditionDesc}>{cond.desc}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* ── Category ──────────────────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Categoría *</Text>
                    <View style={styles.categoryGrid}>
                        {CATEGORIES.map(cat => (
                            <TouchableOpacity
                                key={cat.key}
                                style={[
                                    styles.categoryChip,
                                    selectedCategory === cat.key && styles.categoryChipActive,
                                ]}
                                onPress={() => setSelectedCategory(cat.key)}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={cat.icon}
                                    size={16}
                                    color={selectedCategory === cat.key ? colors.primary : colors.textMuted}
                                />
                                <Text style={[
                                    styles.categoryLabel,
                                    selectedCategory === cat.key && styles.categoryLabelActive,
                                ]}>
                                    {cat.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* ── Description ───────────────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Descripción *</Text>
                    <AppInput
                        ref={descriptionRef}
                        label=""
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Describe el estado, características y cualquier detalle relevante..."
                        multiline
                        numberOfLines={5}
                        style={{ minHeight: 110, textAlignVertical: 'top' }}
                        returnKeyType="done"
                    />
                </View>

                {/* ── Loading indicator for upload ──────────────────── */}
                {loading && (
                    <View style={styles.uploadingBanner}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={styles.uploadingText}>
                            {imageUri ? 'Subiendo imagen y publicando...' : 'Publicando...'}
                        </Text>
                    </View>
                )}

                <AppButton
                    title="Publicar Producto"
                    onPress={handlePublish}
                    loading={loading}
                    style={styles.publishBtn}
                    icon={<Ionicons name="cloud-upload-outline" size={20} color="#fff" />}
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingHorizontal: 16 },

    // ── Image upload placeholder ───────────────────────────────────────
    imageUpload: {
        borderWidth: 2,
        borderColor: colors.border,
        borderStyle: 'dashed',
        borderRadius: 16,
        marginBottom: 20,
        overflow: 'hidden',
    },
    imageUploadInner: {
        height: 130,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.surfaceAlt,
    },
    imageUploadTitle: { ...typography.presets.bodyMedium, color: colors.textSecondary },
    imageUploadSub: { ...typography.presets.caption, color: colors.textMuted },

    // ── Image preview ──────────────────────────────────────────────────
    imagePreviewWrap: {
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
        backgroundColor: colors.backgroundAlt,
    },
    imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 16,
    },
    removeImageBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#fff',
        borderRadius: 14,
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    changeImageBtn: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
    },
    changeImageText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },

    // ── Upload banner ──────────────────────────────────────────────────
    uploadingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: colors.infoLight,
        padding: 14,
        borderRadius: 12,
        marginBottom: 12,
    },
    uploadingText: {
        ...typography.presets.body,
        color: colors.info,
        fontWeight: '600',
    },

    // ── Sections ───────────────────────────────────────────────────────
    section: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    sectionTitle: {
        ...typography.presets.sectionTitle,
        color: colors.text,
        marginBottom: 14,
    },
    currencyIcon: { fontSize: 16, fontWeight: '700', color: colors.textSecondary },

    conditionGrid: { gap: 8 },
    conditionChip: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: colors.inputBg,
    },
    conditionChipActive: {
        backgroundColor: colors.primaryLight + '18',
        borderColor: colors.primary,
    },
    conditionLabel: { ...typography.presets.bodyMedium, color: colors.textSecondary },
    conditionLabelActive: { color: colors.primary, fontWeight: '700' },
    conditionDesc: { ...typography.presets.caption, color: colors.textMuted },

    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: colors.inputBg,
    },
    categoryChipActive: {
        backgroundColor: colors.primaryLight + '18',
        borderColor: colors.primary,
    },

    categoryLabel: { ...typography.presets.label, color: colors.textSecondary },
    categoryLabelActive: { color: colors.primary, fontWeight: '700' },

    publishBtn: { marginTop: 4 },
});
