import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { colors } from '@/theme/colors';

interface SkeletonCardProps {
    numColumns?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ numColumns = 2 }) => {
    const { width } = useWindowDimensions();
    const opacity = useRef(new Animated.Value(0.3)).current;

    const horizontalPadding = 24;
    const gap = 10;
    const cardWidth = (width - horizontalPadding - (numColumns - 1) * gap) / numColumns;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [opacity]);

    return (
        <View style={[styles.card, { width: cardWidth }]}>
            <Animated.View style={[styles.image, { opacity }]} />
            <View style={styles.content}>
                <Animated.View style={[styles.pill, { opacity }]} />
                <Animated.View style={[styles.title, { opacity }]} />
                <Animated.View style={[styles.titleShort, { opacity }]} />
                <View style={styles.footer}>
                    <Animated.View style={[styles.avatar, { opacity }]} />
                    <Animated.View style={[styles.name, { opacity }]} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border,
    },
    image: {
        width: '100%',
        height: 140,
        backgroundColor: colors.backgroundAlt,
    },
    content: {
        padding: 10,
        gap: 8,
    },
    pill: {
        width: 60,
        height: 16,
        borderRadius: 8,
        backgroundColor: colors.backgroundAlt,
    },
    title: {
        width: '90%',
        height: 14,
        borderRadius: 4,
        backgroundColor: colors.backgroundAlt,
    },
    titleShort: {
        width: '60%',
        height: 14,
        borderRadius: 4,
        backgroundColor: colors.backgroundAlt,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    avatar: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.backgroundAlt,
    },
    name: {
        width: '50%',
        height: 10,
        borderRadius: 4,
        backgroundColor: colors.backgroundAlt,
    },
});
