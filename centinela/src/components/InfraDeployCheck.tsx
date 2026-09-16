/**
 * ============================================================================
 * VERIFICACION DE INTEGRIDAD DE INFRAESTRUCTURA (TEMPORAL)
 * ----------------------------------------------------------------------------
 * Muestra la ultima version desplegada del FRONT y del BACK para comprobar de
 * un vistazo que cada repositorio llego al servidor:
 *
 *   Front -> sello VITE_BUILD_STAMP, inyectado por el workflow de deploy.
 *   Back  -> GET /api/version (endpoint temporal agregado por infraestructura).
 *
 * Lo agrega INFRAESTRUCTURA para verificar integridad. NO es parte del
 * producto. Se puede borrar sin afectar nada:
 *   1) eliminar este archivo
 *   2) eliminar el uso <InfraDeployCheck /> en MainLayoutAuth.tsx
 * ============================================================================
 */
import { useEffect, useState } from 'react';

const FRONT_BUILD = import.meta.env.VITE_BUILD_STAMP ?? '(sin sello)';

type ApiVersion = { commit?: string; builtAt?: string };

function apiBaseUrl() {
    return (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');
}

export default function InfraDeployCheck() {
    const [back, setBack] = useState<ApiVersion | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        fetch(`${apiBaseUrl()}/version`, { headers: { Accept: 'application/json' } })
            .then((response) => (response.ok ? response.json() : Promise.reject(new Error('bad status'))))
            .then((data: ApiVersion) => {
                if (!cancelled) setBack(data);
            })
            .catch(() => {
                if (!cancelled) setFailed(true);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const backLabel = back
        ? `${back.builtAt ?? '?'}${back.commit ? ` · ${back.commit}` : ''}`
        : failed
          ? 'sin respuesta'
          : 'consultando...';

    return (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            <p className="font-semibold tracking-wide uppercase">Verificacion de deploy — infra (temporal)</p>
            <p className="mt-1">Front: {FRONT_BUILD}</p>
            <p>Back: {backLabel}</p>
        </div>
    );
}
