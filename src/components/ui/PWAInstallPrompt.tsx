import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

export const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOSGuideVisible, setIsIOSGuideVisible] = useState(false);

    useEffect(() => {
        if (Platform.OS !== 'web') return;

        const handleBeforeInstallPrompt = (e: any) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsVisible(false);
        }

        // iOS detection
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        const isStandalone = (window.navigator as any).standalone === true;
        
        if (isIOS && !isStandalone) {
            setIsVisible(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        
        if (isIOS) {
            setIsIOSGuideVisible(true);
            return;
        }

        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsVisible(false);
        }
    };

    if (!isVisible) return null;

    return (
        <>
            <View style={styles.banner}>
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="phone-portrait-outline" size={20} color="#fff" />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>Instalar App</Text>
                        <Text style={styles.subtitle}>Para una mejor experiencia</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.installBtn} onPress={handleInstallClick}>
                    <Text style={styles.installBtnText}>Instalar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setIsVisible(false)}>
                    <Ionicons name="close" size={18} color={colors.textMuted} />
                </TouchableOpacity>
            </View>

            {/* iOS Guide Modal */}
            <Modal
                visible={isIOSGuideVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsIOSGuideVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Instalar en iOS</Text>
                            <TouchableOpacity onPress={() => setIsIOSGuideVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.guideStep}>
                            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
                            <Text style={styles.stepText}>Toca el botón de <Text style={{fontWeight: '700'}}>Compartir</Text> <Ionicons name="share-outline" size={18} color={colors.primary} /> en el menú inferior del navegador.</Text>
                        </View>
                        
                        <View style={styles.guideStep}>
                            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
                            <Text style={styles.stepText}>Busca y toca en <Text style={{fontWeight: '700'}}>"Añadir a la pantalla de inicio"</Text>.</Text>
                        </View>

                        <TouchableOpacity 
                            style={styles.modalCloseBtn}
                            onPress={() => setIsIOSGuideVisible(false)}
                        >
                            <Text style={styles.modalCloseBtnText}>Entendido</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        marginHorizontal: 16,
        marginTop: 10,
        marginBottom: 10,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        ...typography.presets.bodyMedium,
        color: colors.text,
        fontWeight: '700',
    },
    subtitle: {
        ...typography.presets.caption,
        color: colors.textMuted,
    },
    installBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        marginRight: 10,
    },
    installBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    closeBtn: {
        padding: 4,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.text,
    },
    guideStep: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
        marginBottom: 20,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.primaryLight + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    stepNumberText: {
        color: colors.primary,
        fontWeight: '800',
        fontSize: 14,
    },
    stepText: {
        flex: 1,
        fontSize: 15,
        color: colors.textSecondary,
        lineHeight: 22,
    },
    modalCloseBtn: {
        backgroundColor: colors.primary,
        width: '100%',
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 10,
    },
    modalCloseBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
