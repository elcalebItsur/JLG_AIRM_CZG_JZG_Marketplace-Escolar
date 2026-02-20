import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '@/components/ui/ScreenWrapper';
import { colors } from '@/theme/colors';
import { createProduct } from '@/services/productService';
import { useAuth } from '@/context/AuthContext';

export default function PublishScreen() {
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handlePublish = async () => {
        if (!title || !price || !description || !category) {
            Alert.alert('Error', 'Todos los campos son obligatorios');
            return;
        }

        if (!user) {
            Alert.alert('Error', 'Debes iniciar sesión para publicar');
            return;
        }

        setLoading(true);
        const { success, error } = await createProduct({
            title,
            price: parseFloat(price),
            description,
            category,
            images: ['https://via.placeholder.com/300'], // Placeholder image
            sellerId: user.id,
            sellerName: user.displayName,
        });
        setLoading(false);

        if (success) {
            Alert.alert('Éxito', 'Publicación creada correctamente', [
                { text: 'OK', onPress: () => router.push('/(tabs)') }
            ]);
            resetForm();
        } else {
            Alert.alert('Error', error || 'No se pudo crear la publicación');
        }
    };

    const resetForm = () => {
        setTitle('');
        setPrice('');
        setDescription('');
        setCategory('');
    };

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.header}>Vender Producto</Text>

                <Text style={styles.label}>Título</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej. Libro de Matemáticas"
                    value={title}
                    onChangeText={setTitle}
                />

                <Text style={styles.label}>Precio ($)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                />

                <Text style={styles.label}>Categoría</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej. Libros, Electrónica, Ropa"
                    value={category}
                    onChangeText={setCategory}
                />

                <Text style={styles.label}>Descripción</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Detalles del producto..."
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                />

                <View style={styles.imagePlaceholder}>
                    <Text style={styles.imageText}>📸 Subir Foto (Simulado)</Text>
                </View>

                <Button
                    title={loading ? "Publicando..." : "Publicar"}
                    color={colors.primary}
                    onPress={handlePublish}
                    disabled={loading}
                />
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 20,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        color: colors.textSecondary,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: colors.surface,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    imagePlaceholder: {
        height: 150,
        backgroundColor: '#e1e4e8',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    imageText: {
        color: colors.textSecondary,
    }
});
