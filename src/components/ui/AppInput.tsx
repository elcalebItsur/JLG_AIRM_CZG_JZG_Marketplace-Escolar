import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TextInputProps,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface AppInputProps extends TextInputProps {
    label: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    containerStyle?: ViewStyle;
    onRightIconPress?: () => void;
}

export const AppInput: React.FC<AppInputProps> = ({
    label,
    error,
    leftIcon,
    rightIcon,
    containerStyle,
    onRightIconPress,
    ...props
}) => {
    const [focused, setFocused] = useState(false);

    return (
        <View style={[styles.container, containerStyle]}>
            <Text style={[styles.label, error && styles.labelError]}>{label}</Text>
            <View style={[
                styles.inputWrapper,
                focused && styles.inputWrapperFocused,
                error && styles.inputWrapperError,
            ]}>
                {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
                <TextInput
                    style={[styles.input, leftIcon && styles.inputWithLeftIcon]}
                    placeholderTextColor={colors.textMuted}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    {...props}
                />
                {rightIcon && (
                    <TouchableOpacity
                        style={styles.iconRight}
                        onPress={onRightIconPress}
                        disabled={!onRightIconPress}
                    >
                        {rightIcon}
                    </TouchableOpacity>
                )}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        ...typography.presets.label,
        color: colors.textSecondary,
        marginBottom: 6,
    },
    labelError: {
        color: colors.error,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.inputBg,
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: 12,
        minHeight: 50,
    },
    inputWrapperFocused: {
        borderColor: colors.primary,
        backgroundColor: colors.surface,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 2,
    },
    inputWrapperError: {
        borderColor: colors.error,
        backgroundColor: colors.errorLight,
    },
    input: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: typography.sizes.md,
        color: colors.text,
    },
    inputWithLeftIcon: {
        paddingLeft: 6,
    },
    iconLeft: {
        paddingLeft: 14,
    },
    iconRight: {
        paddingRight: 14,
    },
    errorText: {
        ...typography.presets.caption,
        color: colors.error,
        marginTop: 4,
    },
});
