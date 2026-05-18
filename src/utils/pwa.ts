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
 * 
 * iPhone safe area inset values (approx):
 * - iPhone X/XS/11 Pro:    44px (notch)
 * - iPhone 12/13/14:       47px (notch)
 * - iPhone 14 Pro/15/16:   59px (Dynamic Island)
 * 
 * We use 59px as the fallback to cover the worst case (Dynamic Island).
 * If the safe area context reports a real value, we use whichever is larger.
 */
export const getSafeTopInset = (insetsTop: number): number => {
    if (Platform.OS !== 'web') return insetsTop;
    
    if (isStandaloneMode()) {
        // In PWA standalone, we need to cover the status bar + notch/Dynamic Island
        return Math.max(insetsTop, 59);
    }
    
    // In normal browser, use what the browser tells us (usually 0 since the
    // browser chrome already covers the system UI)
    return insetsTop;
};

/**
 * Returns a safe bottom inset for web, accounting for PWA home indicator.
 * 
 * The home indicator bar on modern iPhones is ~34px. On older devices
 * or Android, it's 0. We use 34px as the fallback for standalone mode.
 */
export const getSafeBottomInset = (insetsBottom: number): number => {
    if (Platform.OS !== 'web') return insetsBottom;
    
    if (isStandaloneMode()) {
        // In PWA standalone, we need to clear the home indicator area
        return Math.max(insetsBottom, 34);
    }
    
    return insetsBottom;
};

/**
 * Returns the CSS env() value for safe area inset, useful for
 * injecting into web-only inline styles.
 */
export const getCSSEnvSafeAreaTop = (): string => {
    if (Platform.OS !== 'web') return '0px';
    return 'env(safe-area-inset-top, 0px)';
};

export const getCSSEnvSafeAreaBottom = (): string => {
    if (Platform.OS !== 'web') return '0px';
    return 'env(safe-area-inset-bottom, 0px)';
};
