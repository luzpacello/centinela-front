import { useEffect, useState } from 'react';
import { getTemplates } from '../services/templateService';

// Cuenta las plantillas e imágenes ISO disponibles en el nodo.
// Solo consulta cuando está habilitado (el catálogo es exclusivo de ADMIN).
export function useTemplates(enabled: boolean) {
    const [count, setCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(enabled);

    useEffect(() => {
        if (!enabled) return;
        const controller = new AbortController();
        setLoading(true);
        getTemplates(controller.signal)
            .then((templates) => {
                if (controller.signal.aborted) return;
                setCount(templates.length);
                setLoading(false);
            })
            .catch(() => {
                if (controller.signal.aborted) return;
                setCount(null);
                setLoading(false);
            });
        return () => controller.abort();
    }, [enabled]);

    return { count, loading };
}
