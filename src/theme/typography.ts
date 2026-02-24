import { TextStyle } from 'react-native';

export const typography = {
    sizes: {
        xs: 11,
        sm: 13,
        md: 15,
        lg: 18,
        xl: 22,
        xxl: 28,
        xxxl: 36,
    },
    weights: {
        regular: '400' as TextStyle['fontWeight'],
        medium: '500' as TextStyle['fontWeight'],
        semibold: '600' as TextStyle['fontWeight'],
        bold: '700' as TextStyle['fontWeight'],
        heavy: '800' as TextStyle['fontWeight'],
    },
    lineHeights: {
        tight: 1.2,
        normal: 1.5,
        loose: 1.8,
    },
    // Named presets
    presets: {
        screenTitle: {
            fontSize: 22,
            fontWeight: '700' as TextStyle['fontWeight'],
            letterSpacing: -0.3,
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: '600' as TextStyle['fontWeight'],
            letterSpacing: 0,
        },
        body: {
            fontSize: 15,
            fontWeight: '400' as TextStyle['fontWeight'],
        },
        bodyMedium: {
            fontSize: 15,
            fontWeight: '500' as TextStyle['fontWeight'],
        },
        caption: {
            fontSize: 12,
            fontWeight: '400' as TextStyle['fontWeight'],
        },
        label: {
            fontSize: 13,
            fontWeight: '500' as TextStyle['fontWeight'],
            letterSpacing: 0.1,
        },
        price: {
            fontSize: 18,
            fontWeight: '700' as TextStyle['fontWeight'],
        },
    },
};
