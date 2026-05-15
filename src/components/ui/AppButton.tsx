import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
    View,
    Platform,
    Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'accent';

interface AppButtonProps {
    title: string;
    onPress: () => void;
    variant?: Variant;
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    icon?: React.ReactNode;
    fullWidth?: boolean;
}

export const AppButton: React.FC<AppButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
    textStyle,
    icon,
    fullWidth = true,
}) => {
    const isDisabled = disabled || loading;
    const [isHovered, setIsHovered] = React.useState(false);
    const scale = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        if (!isDisabled) {
            Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
            if (Platform.OS !== 'web') {
                Haptics.selectionAsync();
            }
        }
    };

    const handlePressOut = () => {
        Animated.spring(scale, { toValue: isHovered ? 1.02 : 1, useNativeDriver: true }).start();
    };

    const handleHoverIn = () => {
        if (Platform.OS === 'web' && !isDisabled) {
            setIsHovered(true);
            Animated.timing(scale, { toValue: 1.02, duration: 200, useNativeDriver: true }).start();
        }
    };

    const handleHoverOut = () => {
        if (Platform.OS === 'web' && !isDisabled) {
            setIsHovered(false);
            Animated.timing(scale, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        }
    };

    return (
        <Animated.View style={{ transform: [{ scale }], width: fullWidth ? '100%' : 'auto' }}>
            <TouchableOpacity
                style={[
                    styles.base,
                    styles[variant] as ViewStyle,
                    isDisabled && styles.disabled,
                    !fullWidth && styles.inline,
                    isHovered && (styles[`${variant}Hover` as keyof typeof styles] as ViewStyle),
                    style,
                ]}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                // @ts-ignore
                onMouseEnter={handleHoverIn}
                // @ts-ignore
                onMouseLeave={handleHoverOut}
                disabled={isDisabled}
                activeOpacity={1}
            >
                {loading ? (
                    <ActivityIndicator color={variant === 'ghost' ? colors.primary : (variant === 'accent' ? colors.primaryDark : '#fff')} size="small" />
                ) : (
                    <View style={styles.row}>
                        {icon && <View style={styles.iconSlot}>{icon}</View>}
                        <Text style={[styles.text, styles[`${variant}Text` as keyof typeof styles] as TextStyle, textStyle]}>
                            {title}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 50,
    },
    inline: {
        alignSelf: 'flex-start',
    },
    // Variants
    primary: {
        backgroundColor: colors.primary,
    },
    secondary: {
        backgroundColor: colors.tagBg,
        borderWidth: 1.5,
        borderColor: colors.border,
    },
    danger: {
        backgroundColor: colors.error,
    },
    ghost: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: colors.primary,
    },
    accent: {
        backgroundColor: colors.accent,
    },
    // Hover variants
    primaryHover: {
        backgroundColor: colors.primaryLight,
    },
    secondaryHover: {
        backgroundColor: colors.background,
    },
    dangerHover: {
        backgroundColor: '#C53030',
    },
    ghostHover: {
        backgroundColor: colors.primary + '10',
    },
    accentHover: {
        backgroundColor: '#ECC94B',
    },
    disabled: {
        opacity: 0.5,
    },
    // Text
    text: {
        ...typography.presets.bodyMedium,
        fontWeight: '600',
    },
    primaryText: { color: '#fff' },
    secondaryText: { color: colors.text },
    dangerText: { color: '#fff' },
    ghostText: { color: colors.primary },
    accentText: { color: colors.primaryDark },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    iconSlot: {
        marginRight: 4,
    },
});
