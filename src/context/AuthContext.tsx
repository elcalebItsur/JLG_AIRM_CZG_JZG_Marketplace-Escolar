import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types/user';
import {
    loginUser,
    loginWithGoogleWeb,
    loginWithGoogleNative,
    registerUser,
    logoutUser,
    subscribeToAuthChanges
} from '@/services/authService';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ error?: string }>;
    loginWithGoogleWeb: () => Promise<{ error?: string }>;
    loginWithGoogleNative: (idToken: string) => Promise<{ error?: string }>;
    register: (email: string, password: string, displayName: string) => Promise<{ error?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: false,
    login: async () => ({}),
    loginWithGoogleWeb: async () => ({}),
    loginWithGoogleNative: async () => ({}),
    register: async () => ({}),
    logout: () => { },
});

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToAuthChanges((user) => {
            setUser(user);
            setIsLoading(false);
        });
        return unsubscribe;
    }, []);

    const login = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const result = await loginUser(email, password);
            if (result.error) return { error: result.error };
            return {};
        } catch (e) {
            return { error: 'Ocurrió un error inesperado' };
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleWeb = async () => {
        setIsLoading(true);
        try {
            const result = await loginWithGoogleWeb();
            if (result.error) return { error: result.error };
            return {};
        } catch (e) {
            return { error: 'Error inesperado con Google' };
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleNative = async (idToken: string) => {
        setIsLoading(true);
        try {
            const result = await loginWithGoogleNative(idToken);
            if (result.error) return { error: result.error };
            return {};
        } catch (e) {
            return { error: 'Error inesperado con Google' };
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (email: string, password: string, displayName: string) => {
        setIsLoading(true);
        try {
            const result = await registerUser(email, password, displayName);
            if (result.error) return { error: result.error };
            return {};
        } catch (e) {
            return { error: 'Ocurrió un error inesperado' };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        await logoutUser();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            login,
            loginWithGoogleWeb: handleGoogleWeb,
            loginWithGoogleNative: handleGoogleNative,
            register,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}
