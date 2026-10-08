import { useEffect, useRef } from 'react';

// Mismo grid que rootDotsStyle de MainLayoutAuth: el punto vive centrado en cada celda.
const GRID = 18;
const DOT_OFFSET = GRID / 2;
const REACH = 180; // alcance del resaltado alrededor del cursor (px)
const MAX_GROWTH = 1.5; // cuánto crece el radio: 1px base -> ~2.5px en el centro

/**
 * Puntos azules que siguen al mouse: cada punto cercano al cursor crece apenas
 * y se tiñe de azul, con caída suave según la distancia. No hay halo ni
 * manchón: solo los puntos del grid cambian de tamaño y color.
 *
 * PARA QUITARLO: eliminar <DotsHover /> de MainLayoutAuth.tsx y borrar este archivo.
 */
export default function DotsHover() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }
        const ctx = canvas.getContext('2d');
        // jsdom no implementa canvas: sin contexto, el efecto simplemente no corre.
        if (!ctx) return;

        let ancho = 0;
        let alto = 0;
        let raf = 0;
        let mx = -9999;
        let my = -9999;
        let activo = false;
        let fuerza = 0; // 0..1, se acerca suave al objetivo al entrar/salir

        const medir = () => {
            const dpr = window.devicePixelRatio || 1;
            ancho = canvas.clientWidth;
            alto = canvas.clientHeight;
            canvas.width = Math.round(ancho * dpr);
            canvas.height = Math.round(alto * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        const mover = (e: PointerEvent) => {
            mx = e.clientX;
            my = e.clientY;
            activo = true;
        };
        const salir = () => {
            activo = false;
        };

        const pintar = () => {
            raf = requestAnimationFrame(pintar);
            fuerza += ((activo ? 1 : 0) - fuerza) * 0.18;
            if (!activo && fuerza < 0.02) {
                if (fuerza !== 0) {
                    fuerza = 0;
                    ctx.clearRect(0, 0, ancho, alto);
                }
                return;
            }
            ctx.clearRect(0, 0, ancho, alto);
            const i0 = Math.floor((mx - REACH - DOT_OFFSET) / GRID);
            const i1 = Math.ceil((mx + REACH - DOT_OFFSET) / GRID);
            const j0 = Math.floor((my - REACH - DOT_OFFSET) / GRID);
            const j1 = Math.ceil((my + REACH - DOT_OFFSET) / GRID);
            for (let i = i0; i <= i1; i++) {
                const x = DOT_OFFSET + i * GRID;
                for (let j = j0; j <= j1; j++) {
                    const y = DOT_OFFSET + j * GRID;
                    const d = Math.hypot(x - mx, y - my);
                    if (d >= REACH) continue;
                    const caida = 1 - d / REACH;
                    const f = caida * caida * fuerza;
                    ctx.beginPath();
                    ctx.fillStyle = `rgba(37, 99, 235, ${(0.92 * f).toFixed(3)})`;
                    ctx.arc(x, y, 1 + MAX_GROWTH * f, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        };

        medir();
        window.addEventListener('resize', medir);
        window.addEventListener('pointermove', mover, { passive: true });
        document.addEventListener('mouseleave', salir);
        window.addEventListener('blur', salir);
        raf = requestAnimationFrame(pintar);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', medir);
            window.removeEventListener('pointermove', mover);
            document.removeEventListener('mouseleave', salir);
            window.removeEventListener('blur', salir);
        };
    }, []);

    return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 h-full w-full" />;
}
