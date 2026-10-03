import { useAuth } from "./AuthContext";

export default function InstanceGate({
    vmid,
    fallback = null,
    children,
}) {
    const { canAccessInstance } = useAuth();

    return canAccessInstance(vmid) ? children : fallback;
}