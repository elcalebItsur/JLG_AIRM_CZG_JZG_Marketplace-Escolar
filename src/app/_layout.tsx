import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/theme/colors';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

function RootLayoutNav() {
    const { user, isLoading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)' || (segments[0] === 'auth'); // Handle both cases just in case

        if (!user && !inAuthGroup) {
            // If user is not logged in and not in auth group, redirect to login
            router.replace('/auth/login');
        } else if (user && inAuthGroup) {
            // If user is logged in and in auth group, redirect to tabs
            router.replace('/(tabs)');
        }
    }, [user, segments, isLoading]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <>
            <StatusBar style="dark" />
            <Stack
                screenOptions={{
                    headerStyle: {
                        backgroundColor: colors.primary,
                    },
                    headerTintColor: colors.surface,
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                    contentStyle: {
                        backgroundColor: colors.background,
                    },
                }}
            >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="auth/login" options={{ headerShown: false }} />
                <Stack.Screen name="auth/register" options={{ headerShown: false }} />
                <Stack.Screen name="auth/setup-admin" options={{ title: 'Configurar Admin' }} />
                <Stack.Screen
                    name="products/[id]"
                    options={{
                        title: 'Detalle',
                        headerStyle: { backgroundColor: colors.primary },
                        headerTintColor: colors.textOnDark,
                    }}
                />
                <Stack.Screen
                    name="products/my-products"
                    options={{ title: 'Mis Publicaciones' }}
                />
                <Stack.Screen
                    name="chat/[chatId]"
                    options={{ headerShown: false }} // header managed inside ChatRoomScreen
                />
                <Stack.Screen
                    name="transactions/history"
                    options={{
                        title: 'Mis Transacciones',
                        headerStyle: { backgroundColor: colors.primary },
                        headerTintColor: colors.textOnDark,
                        headerTitleStyle: { fontWeight: '700' },
                    }}
                />
                <Stack.Screen
                    name="admin/dashboard"
                    options={{
                        title: 'Panel Admin',
                        headerStyle: { backgroundColor: colors.warning },
                        headerTintColor: '#fff',
                        headerTitleStyle: { fontWeight: '700' },
                    }}
                />
                <Stack.Screen
                    name="admin/reports"
                    options={{
                        title: 'Gestionar Reportes',
                        headerStyle: { backgroundColor: colors.warning },
                        headerTintColor: '#fff',
                        headerTitleStyle: { fontWeight: '700' },
                    }}
                />
                <Stack.Screen
                    name="notifications"
                    options={{
                        title: 'Notificaciones',
                        headerStyle: { backgroundColor: colors.primary },
                        headerTintColor: colors.textOnDark,
                        headerTitleStyle: { fontWeight: '700' },
                    }}
                />
            </Stack>
        </>
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <RootLayoutNav />
        </AuthProvider>
    );
}
