import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';
import { colors } from '@/theme/colors';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                headerStyle: {
                    backgroundColor: colors.primary,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                headerTintColor: colors.textOnDark,
                headerTitleStyle: {
                    fontWeight: '700',
                    fontSize: 18,
                    letterSpacing: -0.3,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopWidth: 0,
                    // Shadow for iOS / elevation for Android
                    ...Platform.select({
                        ios: {
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: -3 },
                            shadowOpacity: 0.06,
                            shadowRadius: 10,
                        },
                        android: {
                            elevation: 12,
                        },
                        web: {
                            boxShadow: '0 -2px 12px rgba(0,0,0,0.07)',
                        },
                    }),
                    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
                    paddingTop: 8,
                    height: Platform.OS === 'ios' ? 80 : 62,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: 2,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Marketplace',
                    tabBarLabel: 'Inicio',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? 'home' : 'home-outline'}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="publish"
                options={{
                    title: 'Nueva Publicación',
                    tabBarLabel: 'Vender',
                    tabBarIcon: ({ focused }) => (
                        <View style={[styles.publishIcon, focused && styles.publishIconActive]}>
                            <Ionicons
                                name="add"
                                size={28}
                                color={focused ? colors.primary : colors.textOnDark}
                            />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Mi Perfil',
                    tabBarLabel: 'Perfil',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons
                            name={focused ? 'person' : 'person-outline'}
                            size={24}
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    publishIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -8,
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    publishIconActive: {
        backgroundColor: colors.accentLight,
        borderWidth: 2,
        borderColor: colors.accent,
    },
});
