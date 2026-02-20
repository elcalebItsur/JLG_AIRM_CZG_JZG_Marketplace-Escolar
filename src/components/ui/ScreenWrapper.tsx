import React from 'react';
import { View, StyleSheet, ViewStyle, SafeAreaView, Platform, StatusBar } from 'react-native';
import { colors } from '@/theme/colors';

interface ScreenWrapperProps {
    children: React.ReactNode;
    style?: ViewStyle;
    safeArea?: boolean; // If true, uses SafeAreaView (useful for screens without heavy headers)
    backgroundColor?: string;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
    children,
    style,
    safeArea = true,
    backgroundColor = colors.background
}) => {
    const Container = safeArea ? SafeAreaView : View;

    return (
        <Container style={[styles.container, { backgroundColor }, style]}>
            <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
            <View style={styles.content}>
                {children}
            </View>
        </Container>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    content: {
        flex: 1,
    }
});
