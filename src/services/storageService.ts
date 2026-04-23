import * as ImageManipulator from 'expo-image-manipulator';

const MAX_WIDTH = 800;
const COMPRESS_QUALITY = 0.7; // 70 % JPEG

/**
 * Compress & resize an image, then return it as a base64 data URI.
 * Images are stored directly in Firestore documents (no Firebase Storage needed).
 *
 * With 800px width and 70% JPEG quality, images are typically 50-100 KB.
 * As base64 ~67-133 KB — well within Firestore's 1 MB document limit.
 */
export const uploadImage = async (uri: string, _path?: string): Promise<string | null> => {
    try {


        // 1. Compress the image
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
            console.error('[storageService] ImageManipulator failed to return base64');
            // On some platforms, if base64 fails, we could try to fetch the uri as a fallback
            // but for now let's just log and return null.
            return null;
        }

        // 2. Create a data URI
        const dataUri = `data:image/jpeg;base64,${compressed.base64}`;

        const sizeKB = Math.round((compressed.base64.length * 3) / 4 / 1024);


        return dataUri;
    } catch (error) {
        console.error('[storageService] Error processing image');
        return null;
    }
};

/**
 * Delete an image — no-op since images are stored inline in Firestore.
 */
export const deleteImageByUrl = async (_downloadUrl: string): Promise<void> => {
    // No-op: deleting the product document removes the image data.
};
