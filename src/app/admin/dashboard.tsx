import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { Role } from '@/types/role';
import { AdminDashboardView } from '@/components/admin/AdminDashboardView';

export default function AdminDashboard() {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user || user.role !== Role.ADMIN) {
            router.back();
        }
    }, [user]);

    if (!user || user.role !== Role.ADMIN) return null;

    return <AdminDashboardView />;
}
