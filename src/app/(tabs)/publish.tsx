import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Alert,
    TouchableOpacity, KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { AppButton } from '@/components/ui/AppButton';
import { AppInput } from '@/components/ui/AppInput';
import { createProduct } from '@/services/productService';
import { useAuth } from '@/context/AuthContext';
import { ProductCondition } from '@/types/product';

const CATEGORIES = [
    { key: 'libros', label: 'Libros', emoji: '📚' },
    { key: 'electronica', label: 'Electrónica', emoji: '💻' },
    { key: 'ropa', label: 'Ropa', emoji: '👕' },
    { key: 'papeleria', label: 'Papelería', emoji: '✏️' },
    { key: 'servicios', label: 'Servicios', emoji: '🛠️' },
    { key: 'otros', label: 'Otros', emoji: '📦' },
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
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

    const priceRef = useRef<TextInput>(null);
    const locationRef = useRef<TextInput>(null);
    const descriptionRef = useRef<TextInput>(null);

    const handlePublish = async () => {
        if (!title || !price || !description || !selectedCategory) {
            Alert.alert('Campos vacíos', 'Por favor completa todos los campos requeridos.');
            return;
        }
        if (!user) {
            Alert.alert('Error', 'Debes iniciar sesión para publicar');
            return;
        }

        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            Alert.alert('Precio inválido', 'Ingresa un precio válido mayor a 0');
            return;
        }

        setLoading(true);
        const { success, error } = await createProduct({
            title,
            price: parsedPrice,
            description,
            category: selectedCategory,
            condition: selectedCondition,
            location: location.trim() || undefined,
            images: [],
            sellerId: user.id,
            sellerName: user.displayName,
            sellerRating: 0,
            isFeatured: false,
        });
        setLoading(false);

        if (success) {
            Alert.alert('¡Publicado! 🎉', 'Tu producto ya está visible en el marketplace', [
                { text: 'Ver catálogo', onPress: () => router.push('/') },
            ]);
            setTitle(''); setPrice(''); setDescription('');
            setLocation(''); setSelectedCategory('');
            setSelectedCondition('good');
        } else {
            Alert.alert('Error', error || 'No se pudo publicar');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.root}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Image upload placeholder */}
                <TouchableOpacity style={styles.imageUpload} activeOpacity={0.7}>
                    <View style={styles.imageUploadInner}>
                        <Ionicons name="camera-outline" size={36} color={colors.textMuted} />
                        <Text style={styles.imageUploadTitle}>Agregar fotos</Text>
                        <Text style={styles.imageUploadSub}>Toca para seleccionar (hasta 5)</Text>
                    </View>
                </TouchableOpacity>

                {/* Details */}
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

                {/* Condition */}
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

                {/* Category */}
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
                                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
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

                {/* Description */}
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
    scrollContent: { padding: 16, paddingBottom: 48 },

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
    categoryEmoji: { fontSize: 16 },
    categoryLabel: { ...typography.presets.label, color: colors.textSecondary },
    categoryLabelActive: { color: colors.primary, fontWeight: '700' },

    publishBtn: { marginTop: 4 },
});
