import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, StyleSheet, View, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface AppToastProps {
    visible: boolean;
    message: string;
    type?: ToastType;
    onHide: () => void;
    duration?: number;
}

const TYPE_CONFIG = {
    success: { icon: 'checkmark-circle', color: '#2F855A', bg: '#F0FFF4' },
    error: { icon: 'alert-circle', color: '#C53030', bg: '#FFF5F5' },
    info: { icon: 'information-circle', color: '#2B6CB0', bg: '#EBF8FF' },
    warning: { icon: 'warning', color: '#C05621', bg: '#FFFAF0' },
};

export function AppToast({ visible, message, type = 'success', onHide, duration = 3000 }: AppToastProps) {
    const [shouldRender, setShouldRender] = useState(visible);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(-20)).current;
    const { width } = useWindowDimensions();

    useEffect(() => {
        if (visible) {
            setShouldRender(true);
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start();

            const timer = setTimeout(() => {
                hide();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    const hide = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: -20,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start(() => {
            setShouldRender(false);
            onHide();
        });
    };

    if (!shouldRender) return null;

    const config = TYPE_CONFIG[type];

    return (
        <Animated.View style={[
            styles.container,
            { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                width: Platform.OS === 'web' ? Math.min(width - 40, 400) : width - 40,
                backgroundColor: config.bg,
                borderColor: config.color + '40',
            }
        ]}>
            <View style={[styles.iconWrap, { backgroundColor: config.color + '15' }]}>
                <Ionicons name={config.icon as any} size={20} color={config.color} />
            </View>
            <Text style={[styles.text, { color: config.color }]}>{message}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        zIndex: 9999,
        // Shadow for premium feel
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
            },
            android: {
                elevation: 6,
            },
            web: {
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                alignSelf: 'center',
                left: 'auto',
                right: 'auto',
            }
        })
    },
    iconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    text: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 18,
    }
});
