import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/toast';
import { useInstances } from '@/components/features/instances/hooks/useInstances';
import InstanceDetailContent from '@/components/features/instances/components/detail/InstanceDetailContent';
import InstanceDetailFeedback from '@/components/features/instances/components/detail/InstanceDetailFeedback';

export default function InstanceDetailPage() {
    const { vmid: vmidParam } = useParams<{ vmid: string }>();
    const navigate = useNavigate();
    const { canAccessInstance } = useAuth();
    const {
        instances, isLoading, errorMessage, reloadInventory, pendingPowerActions,
        markPowerActionAccepted, revalidateInventory, transitioningTasks,
    } = useInstances();
    const instanceReference = vmidParam?.trim() ?? '';
    const numericReference = Number(instanceReference);
    const isNumericReference = Number.isSafeInteger(numericReference) && numericReference > 0;
    const isValidReference = Boolean(instanceReference) && (isNumericReference || instanceReference.startsWith('inst_'));
    const hasAccess = isValidReference && canAccessInstance(isNumericReference ? numericReference : instanceReference);

    useEffect(() => {
        if (isValidReference && !hasAccess) {
            toast.add({ title: 'Acceso denegado', description: 'No tenés permisos para consultar esta instancia.', type: 'error' });
            navigate('/instances', { replace: true });
        }
    }, [isValidReference, hasAccess, navigate]);

    const instance = instances.find((item) => String(item.id) === instanceReference);

    if (!isValidReference) {
        return <InstanceDetailFeedback title="Identificador inválido" description="El identificador de la instancia no es válido." />;
    }
    if (!hasAccess) return <p role="status" className={styles.loadingMessage}>Volviendo al inventario…</p>;
    if (isLoading && !instance) return <p role="status" aria-busy="true" className={styles.loadingMessage}>Cargando detalle de la instancia…</p>;
    if (errorMessage && !instance) {
        return <InstanceDetailFeedback title="No se pudo cargar la instancia" description={errorMessage} onRetry={reloadInventory} />;
    }
    if (!instance) {
        return <InstanceDetailFeedback title="Instancia no encontrada" description="No encontramos esa instancia en el inventario actual." />;
    }

    return <InstanceDetailContent key={instanceReference} instance={instance}
        transition={transitioningTasks[instance.id]}
        isPowerActionPending={Boolean(pendingPowerActions[instance.id])}
        onActionAccepted={(action) => markPowerActionAccepted(instance.id, action)}
        onDeleteAccepted={() => { revalidateInventory(); navigate('/instances'); }} />;
}

const styles = {
    loadingMessage: 'py-12 text-center text-sm text-slate-500',
};
