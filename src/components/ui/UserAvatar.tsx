import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { colors } from '@/theme/colors';
import { logger } from '@/utils/logger';

// In-memory cache to avoid duplicate fetches in the same session
const photoCache: Record<string, string | null> = {};

interface UserAvatarProps {
    userId: string;
    userName?: string;
    size?: number;
    initialPhoto?: string | null;
    style?: ViewStyle;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
    userId,
    userName = '?',
    size = 40,
    initialPhoto = null,
    style,
}) => {
    const [photo, setPhoto] = useState<string | null>(initialPhoto || photoCache[userId] || null);
    const [loading, setLoading] = useState(!initialPhoto && !photoCache[userId]);

    useEffect(() => {
        // Guard: Prevent invalid Firestore references if userId is missing
        if (!userId) {
            setLoading(false);
            return;
        }

        // If we already have a photo from props or cache, no need to fetch
        if (photo) {
            setLoading(false);
            return;
        }

        const fetchUserPhoto = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'users', userId));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    const url = data.photoURL || null;
                    photoCache[userId] = url;
                    setPhoto(url);
                }
            } catch (error) {
                logger.error('Error fetching UserAvatar');
            } finally {
                setLoading(false);
            }
        };

        fetchUserPhoto();
    }, [userId]);

    const initials = userName.charAt(0).toUpperCase();

    const containerStyle: ViewStyle = {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        ...style,
    };

    const textStyle: TextStyle = {
        color: '#fff',
        fontSize: size * 0.45,
        fontWeight: '700',
    };

    if (photo) {
        return (
            <View style={containerStyle}>
                <Image 
                    source={{ uri: photo }} 
                    style={styles.image} 
                    resizeMode="cover"
                />
            </View>
        );
    }

    return (
        <View style={containerStyle}>
            <Text style={textStyle}>{initials}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    image: {
        width: '100%',
        height: '100%',
    },
});
