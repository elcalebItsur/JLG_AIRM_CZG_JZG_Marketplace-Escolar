import React, { createContext, useContext, useState, useCallback } from 'react';
import { AppToast, ToastType } from '@/components/ui/AppToast';

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType; duration?: number }>({
        visible: false,
        message: '',
        type: 'success',
    });

    const showToast = useCallback((message: string, type: ToastType = 'success', duration?: number) => {
        setToast({ visible: true, message, type, duration });
    }, []);

    const hideToast = useCallback(() => {
        setToast(prev => ({ ...prev, visible: false }));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <AppToast 
                visible={toast.visible} 
                message={toast.message} 
                type={toast.type} 
                duration={toast.duration}
                onHide={hideToast} 
            />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
