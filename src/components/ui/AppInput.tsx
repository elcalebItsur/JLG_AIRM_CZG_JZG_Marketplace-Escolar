import React, { forwardRef } from 'react';
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
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    containerStyle?: ViewStyle;
    onRightIconPress?: () => void;
    helperText?: string;
}

// forwardRef so Login/Register can chain focus between inputs
export const AppInput = forwardRef<TextInput, AppInputProps>(
    ({ label, error, leftIcon, rightIcon, containerStyle, onRightIconPress, helperText, style, ...props }, ref) => {
        return (
            <View style={[styles.container, containerStyle]}>
                {label ? (
                    <Text style={[styles.label, error && styles.labelError]}>{label}</Text>
                ) : null}

                <View style={[
                    styles.inputWrapper,
                    error && styles.inputWrapperError,
                ]}>
                    {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

                    <TextInput
                        ref={ref}
                        style={[styles.input, leftIcon ? styles.inputWithLeftIcon : null, style]}
                        placeholderTextColor={colors.textMuted}
                        // These defaults give the best cross-platform focus behaviour:
                        // - blurOnSubmit=false → don't dismiss keyboard on "Next"
                        // - returnKeyType → overridable per field
                        blurOnSubmit={props.returnKeyType === 'done' || props.returnKeyType === 'go'}
                        underlineColorAndroid="transparent"
                        {...props}
                    />

                    {rightIcon && (
                        <TouchableOpacity
                            style={styles.iconRight}
                            onPress={onRightIconPress}
                            disabled={!onRightIconPress}
                            // hitSlop makes the icon easier to tap on small screens
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            {rightIcon}
                        </TouchableOpacity>
                    )}
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : (
                    helperText ? <Text style={styles.helperText}>{helperText}</Text> : null
                )}
            </View>
        );
    }
);

AppInput.displayName = 'AppInput';

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
        // Prevent Android from adding its own underline
        textDecorationLine: 'none',
    },
    inputWithLeftIcon: {
        paddingLeft: 8,
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
    helperText: {
        ...typography.presets.caption,
        color: colors.textMuted,
        marginTop: 4,
    },
});
