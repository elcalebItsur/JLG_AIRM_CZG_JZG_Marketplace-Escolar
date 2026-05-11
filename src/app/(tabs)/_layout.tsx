import React, { useEffect, useState } from 'react';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { NativeTabs, Icon, Label, Badge } from 'expo-router/unstable-native-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Platform, useWindowDimensions, TouchableOpacity, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { useAuth } from '@/context/AuthContext';
import { subscribeToChats } from '@/services/chatService';
import { subscribeToNotifications } from '@/services/notificationService';
import { Chat } from '@/types/chat';
import { AppNotification } from '@/types/notification';

export default function TabLayout() {
    const { user } = useAuth();
    const [totalUnreadChats, setTotalUnreadChats] = useState(0);
    const [unreadNotifs, setUnreadNotifs] = useState(0);

    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const isDesktopWeb = Platform.OS === 'web' && width > 800;
    const isMobileWeb = Platform.OS === 'web' && width <= 800;
    const router = useRouter();
    const segments = useSegments();
    const currentTab = segments[segments.length - 1];

    useEffect(() => {
        if (!user) return;

        const unsubChats = subscribeToChats(user.id, (chats: Chat[]) => {
            const count = chats
                .filter(c => c.lastSenderId !== user.id)
                .reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
            setTotalUnreadChats(count);
        });

        const unsubNotifs = subscribeToNotifications(user.id, (notifs: AppNotification[]) => {
            const count = notifs.filter(n => !n.isRead).length;
            setUnreadNotifs(count);
        });

        return () => {
            unsubChats();
            unsubNotifs();
        };
    }, [user]);

    const SidebarItem = ({ name, icon, label, focused, badge, route }: { name: string, icon: any, label: string, focused: boolean, badge?: number, route: string }) => (
        <TouchableOpacity
            style={[styles.sidebarItem, focused && styles.sidebarItemActive]}
            onPress={() => router.push(route as any)}
            activeOpacity={0.7}
        >
            <View style={[styles.sidebarIconWrap, focused && styles.sidebarIconWrapActive]}>
                <Ionicons name={focused ? icon : `${icon}-outline`} size={22} color={focused ? colors.primary : colors.textSecondary} />
                {badge && badge > 0 ? (
                    <View style={styles.sidebarBadge}>
                        <Text style={styles.sidebarBadgeText}>{badge > 9 ? '9+' : badge}</Text>
                    </View>
                ) : null}
            </View>
            <Text style={[styles.sidebarLabel, focused && styles.sidebarLabelActive]}>{label}</Text>
        </TouchableOpacity>
    );

    // ─── iOS: Native Liquid Glass Tab Bar ─────────────────────────────────────
    if (Platform.OS === 'ios') {
        return (
            <NativeTabs 
                minimizeBehavior="onScrollDown"
                tintColor={colors.primary}
            >
                <NativeTabs.Trigger 
                    name="index"
                    options={{
                        title: 'Inicio',
                        icon: { sf: 'house' },
                        selectedIcon: { sf: 'house.fill' }
                    }}
                />

                <NativeTabs.Trigger 
                    name="publish"
                    options={{
                        title: 'Vender',
                        icon: { sf: 'plus.circle' },
                        selectedIcon: { sf: 'plus.circle.fill' }
                    }}
                />

                <NativeTabs.Trigger 
                    name="chats"
                    options={{
                        title: 'Chats',
                        icon: { sf: 'bubble.left.and.bubble.right' },
                        selectedIcon: { sf: 'bubble.left.and.bubble.right.fill' },
                        badgeValue: totalUnreadChats > 0 ? (totalUnreadChats > 9 ? '9+' : String(totalUnreadChats)) : undefined
                    }}
                />

                <NativeTabs.Trigger 
                    name="profile"
                    options={{
                        title: 'Perfil',
                        icon: { sf: 'person' },
                        selectedIcon: { sf: 'person.fill' },
                        badgeValue: unreadNotifs > 0 ? (unreadNotifs > 9 ? '9+' : String(unreadNotifs)) : undefined
                    }}
                />
            </NativeTabs>
        );
    }


    // ─── Android & Web: JavaScript Tab Bar ────────────────────────────────────
    const content = (
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
                    display: isDesktopWeb ? 'none' : 'flex',
                    backgroundColor: colors.surface,
                    borderTopWidth: 0,
                    ...Platform.select({
                        android: { elevation: 8 },
                        web: { boxShadow: '0 -2px 12px rgba(0,0,0,0.07)' },
                    }),
                    // PWA safe area: on mobile web (standalone), the safe area context
                    // may report 0 for bottom. Use a sensible default that clears the
                    // iOS home indicator and Android nav gestures.
                    paddingBottom: isMobileWeb ? Math.max(insets.bottom, 16) : Math.max(insets.bottom, 10),
                    paddingTop: 8,
                    height: isMobileWeb ? (60 + Math.max(insets.bottom, 16)) : (68 + Math.max(insets.bottom - 10, 0)),
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginTop: 2,
                    letterSpacing: 0.1,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Marketplace',
                    headerShown: false,
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
                        <View style={[
                            styles.publishIcon,
                            focused && styles.publishIconActive,
                        ]}>
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
                name="chats"
                options={{
                    title: 'Mensajes',
                    tabBarLabel: 'Chats',
                    tabBarIcon: ({ color, focused }) => (
                        <View>
                            <Ionicons
                                name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
                                size={24}
                                color={color}
                            />
                            {totalUnreadChats > 0 && (
                                <View style={styles.tabBadge}>
                                    <Text style={styles.tabBadgeText}>
                                        {totalUnreadChats > 9 ? '9+' : totalUnreadChats}
                                    </Text>
                                </View>
                            )}
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
                        <View>
                            <Ionicons
                                name={focused ? 'person' : 'person-outline'}
                                size={24}
                                color={color}
                            />
                            {unreadNotifs > 0 && (
                                <View style={styles.tabBadge}>
                                    <Text style={styles.tabBadgeText}>
                                        {unreadNotifs > 9 ? '9+' : unreadNotifs}
                                    </Text>
                                </View>
                            )}
                        </View>
                    ),
                }}
            />
        </Tabs>
    );

    if (isDesktopWeb) {
        return (
            <View style={styles.webContainer}>
                <View style={styles.sidebar}>
                    <View style={styles.sidebarHeader}>
                        <View style={styles.logoWrap}>
                            <Ionicons name="storefront" size={24} color="#fff" />
                        </View>
                        <View>
                            <Text style={styles.logoText}>Marketplace</Text>
                            <Text style={styles.logoSubtext}>ITSUR</Text>
                        </View>
                    </View>

                    <View style={styles.sidebarContent}>
                        <SidebarItem
                            name="index"
                            icon="home"
                            label="Inicio"
                            focused={currentTab === 'index' || currentTab === '(tabs)'}
                            route="/(tabs)"
                        />
                        <SidebarItem
                            name="notifications"
                            icon="notifications"
                            label="Notificaciones"
                            focused={currentTab === 'notifications'}
                            route="/notifications"
                        />
                        <SidebarItem
                            name="publish"
                            icon="add-circle"
                            label="Vender"
                            focused={currentTab === 'publish'}
                            route="/(tabs)/publish"
                        />
                        <SidebarItem
                            name="chats"
                            icon="chatbubbles"
                            label="Chats"
                            focused={currentTab === 'chats'}
                            badge={totalUnreadChats}
                            route="/(tabs)/chats"
                        />
                        <SidebarItem
                            name="profile"
                            icon="person"
                            label="Mi Perfil"
                            focused={currentTab === 'profile'}
                            badge={unreadNotifs}
                            route="/(tabs)/profile"
                        />
                        
                        <View style={styles.sidebarDivider} />
                        
                        <TouchableOpacity
                            style={styles.sidebarItem}
                            onPress={() => {
                                const supportEmail = 'soporte.marketplaceitsur@gmail.com';
                                const subject = 'Ayuda y Soporte - Marketplace ITSUR';
                                const body = `Hola equipo de soporte,\n\n` +
                                    `Datos del usuario:\n` +
                                    `- Nombre: ${user?.displayName || 'N/A'}\n` +
                                    `- Correo: ${user?.email || 'N/A'}\n` +
                                    `- ID: ${user?.id || 'N/A'}\n\n` +
                                    `[Describe tu problema o duda aquí]\n\n` +
                                    `---`;
                                const url = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                                Linking.openURL(url);
                            }}
                            activeOpacity={0.7}
                        >
                            <View style={styles.sidebarIconWrap}>
                                <Ionicons name="help-circle-outline" size={22} color={colors.textSecondary} />
                            </View>
                            <Text style={styles.sidebarLabel}>Ayuda y Soporte</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.sidebarFooter}>
                        <Text style={styles.footerText}>© 2026 Marketplace ITSUR</Text>
                        <Text style={styles.footerSubtext}>v2.0.1</Text>
                    </View>
                </View>
                <View style={styles.webMainContent}>
                    {content}
                </View>
            </View>
        );
    }

    return content;
}

const styles = StyleSheet.create({
    webContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: colors.background,
    },
    sidebar: {
        width: 280,
        backgroundColor: colors.surface,
        borderRightWidth: 1,
        borderRightColor: colors.border,
        paddingVertical: 32,
        paddingHorizontal: 20,
        justifyContent: 'space-between',
        // Optional subtle shadow for depth
        boxShadow: '4px 0 10px rgba(0,0,0,0.02)',
    },
    sidebarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 48,
        paddingHorizontal: 8,
    },
    logoWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoText: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.primary,
        letterSpacing: -0.5,
    },
    logoSubtext: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textMuted,
        marginTop: -2,
    },
    sidebarContent: {
        flex: 1,
        gap: 8,
    },
    sidebarItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        gap: 12,
    },
    sidebarItemActive: {
        backgroundColor: colors.primary + '10',
    },
    sidebarIconWrap: {
        width: 24,
        alignItems: 'center',
    },
    sidebarIconWrapActive: {
        // any active icon wrap styles
    },
    sidebarLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    sidebarLabelActive: {
        color: colors.primary,
        fontWeight: '700',
    },
    sidebarDivider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 12,
        marginHorizontal: 12,
        opacity: 0.6,
    },
    sidebarBadge: {
        position: 'absolute',
        top: -8,
        right: -10,
        backgroundColor: colors.error,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    sidebarBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
    },
    sidebarFooter: {
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingHorizontal: 8,
    },
    footerText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textMuted,
    },
    footerSubtext: {
        fontSize: 11,
        color: colors.textMuted,
        opacity: 0.7,
        marginTop: 2,
    },
    webMainContent: {
        flex: 1,
    },
    publishIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -10,
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
    tabBadge: {
        position: 'absolute',
        top: -4,
        right: -8,
        backgroundColor: colors.error,
        borderRadius: 9,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    tabBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
    },
});
