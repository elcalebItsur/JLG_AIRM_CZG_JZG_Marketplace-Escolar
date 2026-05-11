import { Platform } from 'react-native';

/**
 * Detects if the app is running in standalone mode (installed PWA)
 */
export const isStandaloneMode = (): boolean => {
    if (Platform.OS !== 'web') return false;
    
    return (
        (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://')
    );
};

/**
 * Returns a safe top inset for web, accounting for PWA status bar.
 * If in PWA standalone mode, we usually need at least 44px for iOS notches
 * if the safe area context returns 0.
 */
export const getSafeTopInset = (insetsTop: number): number => {
    if (Platform.OS !== 'web') return insetsTop;
    
    if (isStandaloneMode()) {
        // In PWA, we always want to cover the status bar area
        return Math.max(insetsTop, 44);
    }
    
    // In normal browser, we only use what the browser tells us (usually 0)
    return insetsTop;
};

/**
 * Returns a safe bottom inset for web, accounting for PWA home indicator.
 */
export const getSafeBottomInset = (insetsBottom: number): number => {
    if (Platform.OS !== 'web') return insetsBottom;
    
    if (isStandaloneMode()) {
        // In PWA standalone, we need to clear the home indicator area
        return Math.max(insetsBottom, 20);
    }
    
    return insetsBottom;
};
