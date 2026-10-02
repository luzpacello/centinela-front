import { useAuth } from "./AuthContext";
import type { ReactNode } from 'react';
import type { UserRole } from '@/components/features/auth/types/authentication';

interface PermissionGateProps {
    requiredRole?: UserRole;
    fallback?: ReactNode;
    children: ReactNode;
}

export default function PermissionGate({
    requiredRole,
    fallback = null,
    children,
}: PermissionGateProps) {
    const { hasRole } = useAuth();

    return requiredRole === undefined || hasRole(requiredRole) ? children : fallback;
}
