import * as ImageManipulator from 'expo-image-manipulator';
import { logger } from '@/utils/logger';

const MAX_WIDTH = 800;
const COMPRESS_QUALITY = 0.7; // 70% JPEG quality

/**
 * Comprime y redimensiona una imagen, devolviéndola como una URI de datos base64.
 * Esto evita el uso de Firebase Storage para sortear restricciones regionales.
 */
export const uploadImage = async (uri: string, _path?: string): Promise<string | null> => {
    try {
        // Si ya es una URI de datos, no hacemos nada
        if (uri.startsWith('data:')) return uri;

        const compressed = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: MAX_WIDTH } }],
            {
                compress: COMPRESS_QUALITY,
                format: ImageManipulator.SaveFormat.JPEG,
                base64: true,
            },
        );

        if (!compressed || !compressed.base64) {
            logger.error('[storageService] Error: No se pudo generar base64');
            return null;
        }

        return `data:image/jpeg;base64,${compressed.base64}`;
    } catch (error) {
        logger.error('[storageService] Error procesando imagen:', error);
        return null;
    }
};

/**
 * No-op: Las imágenes están embebidas en Firestore.
 */
export const deleteImageByUrl = async (_downloadUrl: string): Promise<void> => {
    // No es necesario hacer nada al borrar el producto
};
