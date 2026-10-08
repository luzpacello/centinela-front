import { useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'centinela:intro-visto';
const FADE_MS = 700;

/**
 * Intro de bienvenida: reproduce el video una vez por sesión de navegador,
 * encima del login. Al terminar el video (o al saltarlo) se desvanece y deja
 * ver la pantalla que está detrás.
 *
 * PARA QUITAR LA INTRO: eliminar <IntroVideo /> de MainLayoutAuth.tsx, borrar
 * este archivo y el video public/intro.mp4. El resto del código no la usa.
 */
export default function IntroVideo() {
    // El estado inicial se calcula una sola vez: si ya se vio en esta sesión
    // o el sistema pide menos movimiento, directamente no se muestra.
    const [visible, setVisible] = useState(() => {
        if (typeof window === 'undefined') return false;
        // matchMedia no existe en jsdom/entornos viejos: solo se consulta si está.
        if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return false;
        }
        return window.sessionStorage.getItem(STORAGE_KEY) === null;
    });
    const [fading, setFading] = useState(false);
    const hideTimer = useRef<number | null>(null);

    useEffect(() => {
        if (visible) window.sessionStorage.setItem(STORAGE_KEY, '1');
        return () => {
            if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
        };
    }, [visible]);

    const ocultar = () => {
        setFading(true);
        hideTimer.current = window.setTimeout(() => setVisible(false), FADE_MS);
    };

    if (!visible) return null;

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#0f172a] transition-opacity duration-700 ease-out ${
                fading ? 'pointer-events-none opacity-0' : 'opacity-100'
            }`}
        >
            <video
                className="h-full w-full object-cover"
                src="/intro.mp4"
                autoPlay
                muted
                playsInline
                preload="auto"
                aria-hidden="true"
                onEnded={ocultar}
                onError={ocultar}
            />
            {!fading && (
                <button
                    type="button"
                    onClick={ocultar}
                    className="absolute right-5 bottom-5 rounded-lg border border-white/25 bg-black/30 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/50"
                >
                    Saltar
                </button>
            )}
        </div>
    );
}
