import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

export function useGuardiaRol(rolesProhibidos: string[], rutaRedireccion: string = '/dashboard') {
    const navigate = useNavigate();
    const [estaAutorizado, setEstaAutorizado] = useState(() => {
        const rawUser = window.sessionStorage.getItem('centinela_user');

        if (!rawUser) {
            return false;
        }

        try {
            const user = JSON.parse(rawUser);
            return !rolesProhibidos.includes(user.rol);
        } catch {
            return false;
        }
    });

    useEffect(() => {
        if (estaAutorizado) {
            return;
        }

        const rawUser = window.sessionStorage.getItem('centinela_user');

        if (!rawUser) {
            navigate('/login', { replace: true });
            return;
        }

        try {
            const user = JSON.parse(rawUser);
            if (rolesProhibidos.includes(user.rol)) {
                navigate(rutaRedireccion, { replace: true });
            } else {
                setEstaAutorizado(true);
            }
        } catch {
            navigate('/login', { replace: true });
        }
    }, [estaAutorizado, navigate, rolesProhibidos, rutaRedireccion]);

    return estaAutorizado;
}