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
 * Cross-platform choice dialog (2 positive options + cancel).
 * On web: shows confirm for the first option, then alert for success.
 * On native: shows Alert with all options.
 */
export function showChoice(
    title: string,
    message: string,
    options: Array<{ text: string; onPress: () => void; style?: 'cancel' | 'default' | 'destructive' }>,
) {
    if (Platform.OS === 'web') {
        // On web, show a simpler confirm for the primary action
        const primaryOption = options.find(o => o.style !== 'cancel');
        if (primaryOption) {
            const confirmed = window.confirm(`${title}\n\n${message}`);
            if (confirmed) {
                primaryOption.onPress();
            }
        }
    } else {
        Alert.alert(title, message, options);
    }
}
