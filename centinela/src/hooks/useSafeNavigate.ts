import { useNavigate, type NavigateFunction } from 'react-router';

/**
 * Devuelve una función de navegación que funciona dentro y fuera de un router.
 *
 * Las pruebas de aceptación renderizan las páginas sueltas (sin <Router>), y en
 * react-router `useNavigate()` lanza una excepción en ese contexto. Capturamos
 * ese caso y caemos a la History API para que el componente siga renderizando y
 * la acción no rompa la vista. Dentro de la aplicación real se usa el navigate
 * del router con normalidad.
 */
export function useSafeNavigate(): (to: string) => void {
    let navigate: NavigateFunction | null = null;
    try {
        navigate = useNavigate();
    } catch {
        navigate = null;
    }

    return (to) => {
        if (navigate) {
            void navigate(to);
            return;
        }
        window.history.pushState(null, '', to);
        window.dispatchEvent(new PopStateEvent('popstate'));
    };
}
