import { useAuth } from "./AuthContext";

export default function PermissionGate({
    requiredRole,
    fallback = null,
    children,
}) {
    const { hasRole } = useAuth();

    return hasRole(requiredRole) ? children : fallback;
}