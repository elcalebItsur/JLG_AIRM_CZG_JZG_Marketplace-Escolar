import { Alert, Platform } from 'react-native';

/**
 * Cross-platform alert that works on iOS, Android, AND Web.
 * On native it uses React Native's Alert.alert().
 * On web it uses window.alert() which is always reliable.
 */
export function showAlert(title: string, message?: string, onOk?: () => void) {
    if (Platform.OS === 'web') {
        window.alert(message ? `${title}\n\n${message}` : title);
        onOk?.();
    } else {
        Alert.alert(title, message, [{ text: 'OK', onPress: onOk }]);
    }
}

/**
 * Cross-platform confirm dialog.
 * On native it uses Alert.alert() with Cancel/Confirm buttons.
 * On web it uses window.confirm() which always works.
 *
 * Returns a Promise<boolean> — true if confirmed, false if cancelled.
 */
export function showConfirm(
    title: string,
    message: string,
    confirmText: string = 'Confirmar',
    cancelText: string = 'Cancelar',
): Promise<boolean> {
    if (Platform.OS === 'web') {
        const result = window.confirm(`${title}\n\n${message}`);
        return Promise.resolve(result);
    }

    return new Promise((resolve) => {
        Alert.alert(title, message, [
            { text: cancelText, style: 'cancel', onPress: () => resolve(false) },
            { text: confirmText, onPress: () => resolve(true) },
        ]);
    });
}

/**
 * Specialized choice for image sources (Camera vs Gallery).
 * Handles ActionSheetIOS on iOS and reliable fallbacks elsewhere.
 */
export function showImageSourcePicker(
    onCamera: () => void,
    onGallery: () => void,
    onCancel?: () => void,
) {
    if (Platform.OS === 'ios') {
        const ActionSheetIOS = require('react-native').ActionSheetIOS;
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: ['Cancelar', 'Tomar foto', 'Elegir de galería'],
                cancelButtonIndex: 0,
            },
            (buttonIndex: number) => {
                if (buttonIndex === 1) onCamera();
                if (buttonIndex === 2) onGallery();
                if (buttonIndex === 0) onCancel?.();
            },
        );
    } else if (Platform.OS === 'web') {
        // Simple sequential choice for web
        const wantCamera = window.confirm("¿Usa la cámara? (Aceptar para Cámara, Cancelar para Galería)");
        if (wantCamera) {
            onCamera();
        } else {
            // Note: browser cancel doesn't mean "stop everything", it's just the 'else' in this simple flow
            // If they want to cancel completely, they'd have to choose gallery and then not pick a file,
            // or we could add another confirm but that's annoying.
            onGallery();
        }
    } else {
        // Android
        Alert.alert(
            'Agregar foto',
            'Selecciona el origen',
            [
                { text: 'Cancelar', style: 'cancel', onPress: onCancel },
                { text: 'Tomar foto', onPress: onCamera },
                { text: 'Galería', onPress: onGallery },
            ]
        );
    }
}
