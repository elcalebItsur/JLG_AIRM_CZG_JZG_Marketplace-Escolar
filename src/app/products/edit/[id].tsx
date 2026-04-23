import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, KeyboardAvoidingView, Platform, TextInput,
    Image, ActivityIndicator, Alert,
} from 'react-native';
import { showAlert, showConfirm, showImageSourcePicker } from '@/utils/crossPlatformAlert';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { ComponentProps } from 'react';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { getProductById, updateProduct } from '@/services/productService';
import { useAuth } from '@/context/AuthContext';
import { ProductCondition, Product } from '@/types/product';
import { uploadImage } from '@/services/storageService';

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

export default function EditProductScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedCondition, setSelectedCondition] = useState<ProductCondition>('good');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const { user } = useAuth();
    const router = useRouter();

    const priceRef = useRef<TextInput>(null);
    const locationRef = useRef<TextInput>(null);
    const descriptionRef = useRef<TextInput>(null);

    useEffect(() => {
        if (id) loadProduct();
    }, [id]);

    const loadProduct = async () => {
        setLoading(true);
        try {
            const product = await getProductById(id);
            if (product) {
                // Verify ownership
                if (user && product.sellerId !== user.id) {
                    showAlert('Acceso denegado', 'No puedes editar un producto que no te pertenece.');
                    router.back();
                    return;
                }

                setTitle(product.title);
                setPrice(product.price.toString());
                setDescription(product.description);
                setLocation(product.location || '');
                setSelectedCategory(product.category);
                setSelectedCondition(product.condition);
                const img = product.images?.[0] || null;
                setImageUri(img);
                setOriginalImage(img);
            } else {
                showAlert('Error', 'No se encontró el producto.');
                router.back();
            }
        } catch (e) {
            console.error('loadProduct error');
            showAlert('Error', 'No se pudieron cargar los datos del producto.');
        } finally {
            setLoading(false);
        }
    };

    // ─── Permissions ────────────────────────────────────────────────────
    const requestCameraPermission = async (): Promise<boolean> => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara.');
            return false;
        }
        return true;
    };

    const requestGalleryPermission = async (): Promise<boolean> => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso requerido', 'Se necesita acceso a tu galería.');
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

    // ─── Update ────────────────────────────────────────────────────────
    const handleUpdate = async () => {
        if (!title || !price || !description || !selectedCategory) {
            showAlert('Campos vacíos', 'Por favor completa todos los campos requeridos.');
            return;
        }

        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            showAlert('Precio inválido', 'Ingresa un precio válido');
            return;
        }

        const confirmed = await showConfirm(
            'Guardar cambios',
            '¿Deseas actualizar la información de este producto?',
            'Guardar'
        );
        if (!confirmed) return;

        setSaving(true);
        
        try {
            let finalImageUri = imageUri;
            // If image was changed and it's a local URI, upload/compress it
            if (imageUri && imageUri !== originalImage && !imageUri.startsWith('data:') && !imageUri.startsWith('http')) {
                const uploaded = await uploadImage(imageUri);
                if (uploaded) finalImageUri = uploaded;
            }

            const { success, error } = await updateProduct(id, {
                title,
                price: parsedPrice,
                description,
                category: selectedCategory,
                condition: selectedCondition,
                location: location.trim() || undefined,
                images: finalImageUri ? [finalImageUri] : [],
            });
            
            if (success) {
                showAlert('Cambios guardados', 'El producto ha sido actualizado correctamente.', () => {
                    router.back();
                });
            } else {
                showAlert('Error', error || 'No se pudo actualizar el producto.');
            }
        } catch (e) {
            console.error('handleUpdate error');
            showAlert('Error', 'Ocurrió un error al intentar actualizar.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Cargando datos del producto...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            <Stack.Screen options={{ title: 'Editar Producto' }} />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* ── Image ─────────────────────────────────── */}
                <TouchableOpacity style={styles.imagePreviewWrap} activeOpacity={0.9} onPress={handleImagePress}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Ionicons name="camera-outline" size={40} color={colors.textMuted} />
                            <Text style={styles.imagePlaceholderText}>Añadir imagen</Text>
                        </View>
                    )}
                    <View style={styles.editOverlay}>
                        <Ionicons name="camera" size={20} color="#fff" />
                        <Text style={styles.editOverlayText}>Cambiar foto</Text>
                    </View>
                </TouchableOpacity>

                {/* ── Details ──────────────────────────────────────── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Información del producto</Text>

                    <AppInput
                        label="Título *"
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Título del producto"
                        leftIcon={<Ionicons name="pricetag-outline" size={18} color={colors.textMuted} />}
                        onSubmitEditing={() => priceRef.current?.focus()}
                    />

                    <AppInput
                        ref={priceRef}
                        label="Precio (MXN) *"
                        value={price}
                        onChangeText={setPrice}
                        placeholder="0.00"
                        keyboardType="numeric"
                        leftIcon={<Text style={styles.currencyIcon}>$</Text>}
                        onSubmitEditing={() => locationRef.current?.focus()}
                    />

                    <AppInput
                        ref={locationRef}
                        label="Ubicación (opcional)"
                        value={location}
                        onChangeText={setLocation}
                        placeholder="Ej. Biblioteca, Edificio A"
                        leftIcon={<Ionicons name="location-outline" size={18} color={colors.textMuted} />}
                        onSubmitEditing={() => descriptionRef.current?.focus()}
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
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Detalles sobre el producto..."
                        multiline
                        numberOfLines={5}
                        style={{ minHeight: 110, textAlignVertical: 'top' }}
                    />
                </View>

                <AppButton
                    title="Guardar Cambios"
                    onPress={handleUpdate}
                    loading={saving}
                    style={styles.saveBtn}
                    icon={<Ionicons name="save-outline" size={20} color="#fff" />}
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: 16, paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { ...typography.presets.caption, color: colors.textMuted, marginTop: 12 },

    imagePreviewWrap: {
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: colors.surfaceAlt,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    imagePreview: { width: '100%', height: '100%' },
    imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
    imagePlaceholderText: { ...typography.presets.body, color: colors.textMuted },
    
    editOverlay: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    editOverlayText: { color: '#fff', fontSize: 13, fontWeight: '700' },

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
    sectionTitle: { ...typography.presets.sectionTitle, color: colors.text, marginBottom: 14 },
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
    },
    conditionChipActive: { backgroundColor: colors.primaryLight + '15', borderColor: colors.primary },
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
    },
    categoryChipActive: { backgroundColor: colors.primaryLight + '15', borderColor: colors.primary },
    categoryLabel: { ...typography.presets.label, color: colors.textSecondary },
    categoryLabelActive: { color: colors.primary, fontWeight: '700' },

    saveBtn: { marginTop: 8 },
});
