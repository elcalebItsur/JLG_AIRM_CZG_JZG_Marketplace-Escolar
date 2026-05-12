import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { User } from '@/types/user';
import { logger } from '@/utils/logger';

const USERS = 'users';

/**
 * Update user profile information in Firestore.
 */
export const updateUserProfile = async (
    userId: string,
    data: Partial<Pick<User, 'phoneNumber' | 'bio' | 'major'>>
): Promise<{ success: boolean; error?: string }> => {
    try {
        const userRef = doc(db, USERS, userId);
        await updateDoc(userRef, data);
        return { success: true };
    } catch (error: any) {
        logger.error('updateUserProfile error:', error);
        return { 
            success: false, 
            error: error.message || 'No se pudo actualizar el perfil' 
        };
    }
};
