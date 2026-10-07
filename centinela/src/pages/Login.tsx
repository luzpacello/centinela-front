import { User } from 'lucide-react';
import { useLocation } from 'react-router';
import LoginForm from '@/components/features/auth/components/LoginForm';

export default function LoginPage() {
  const location = useLocation();
  const initialEmail = typeof location.state?.email === 'string' ? location.state.email : '';
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <section className={styles.cardPrincipal}>

        <div className={styles.cardCircular}>
          <User aria-hidden="true" className="size-8 text-[#2563eb]" strokeWidth={1.75} />
        </div>

        <h1 className={styles.title}>Iniciar sesión</h1>
        <p className={styles.subtitle}>Ingresá tus credenciales para acceder a Centinela</p>
        <LoginForm initialEmail={initialEmail} />

      </section>

      <p className="text-[13px] text-[#64748b]">
        © {currentYear} Centinela. Todos los derechos reservados.
      </p>
    </div>
  );
}

const styles = {
  cardPrincipal: "flex w-full max-w-[660px] flex-col items-center gap-5 rounded-[12px] border border-[#e2e8f0] bg-white px-6 py-10 text-center shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)] sm:px-12",
  cardCircular: "flex size-16 items-center justify-center rounded-full bg-[#bfdbfe]",
  title: "mb-0 text-[28px] font-bold text-[#0f172a]",
  subtitle: "text-[15px] text-[#475569]",
}
