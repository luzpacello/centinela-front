import { useEffect, useState } from 'react';

// Ritmo del efecto: por letra, pausa en completo, borrado y pausa antes de reiniciar.
const TYPING_SPEED = 60;
const HOLD_DURATION = 3000;
const DELETE_SPEED = 30;
const RESTART_DELAY = 500;

type Phase = 'typing' | 'holding' | 'deleting' | 'pausing';

// Se lee una vez y con guardas: jsdom no implementa matchMedia.
function prefersReducedMotion(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
  } catch {
    return false;
  }
}

interface TypewriterTextProps {
  text: string;
  className?: string;
}

export function TypewriterText({ text, className }: TypewriterTextProps) {
  const [reduced, setReduced] = useState<boolean>(prefersReducedMotion);
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState<Phase>('typing');

  // Sigue cambios de la preferencia sin bloquear el primer render.
  useEffect(() => {
    try {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
      const query = window.matchMedia('(prefers-reduced-motion: reduce)');
      const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
      query.addEventListener?.('change', onChange);
      return () => query.removeEventListener?.('change', onChange);
    } catch {
      return;
    }
  }, []);

  // Máquina de estados: un timer por paso, limpiado en cada desmontaje de efecto.
  useEffect(() => {
    if (reduced) return;
    const delay =
      phase === 'typing' ? TYPING_SPEED
        : phase === 'holding' ? HOLD_DURATION
          : phase === 'deleting' ? DELETE_SPEED
            : RESTART_DELAY;
    const timer = setTimeout(() => {
      if (phase === 'typing') {
        if (count < text.length) setCount(count + 1);
        else setPhase('holding');
      } else if (phase === 'holding') {
        setPhase('deleting');
      } else if (phase === 'deleting') {
        if (count > 0) setCount(count - 1);
        else setPhase('pausing');
      } else {
        setPhase('typing');
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [count, phase, reduced, text]);

  const visibleText = reduced ? text : text.slice(0, count);

  return (
    <h1 className={className} aria-label={text}>
      <span className="relative block">
        {/* Placeholder invisible con el texto completo: reserva las líneas y evita saltos de layout. */}
        <span aria-hidden="true" className="invisible block">
          {text}
        </span>
        {/* Capa animada superpuesta, mismo ancho y wrap que el placeholder. */}
        <span aria-hidden="true" data-testid="typewriter-text" className="absolute inset-0">
          {visibleText}
          {!reduced && (
            <span className="auth-cursor ml-0.5 inline-block h-[1em] w-[0.5em] translate-y-[0.15em] bg-[#2563eb]" />
          )}
        </span>
      </span>
    </h1>
  );
}
