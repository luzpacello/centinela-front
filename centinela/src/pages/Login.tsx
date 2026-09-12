import { User } from 'lucide-react';
import { useLocation } from 'react-router';
import LoginForm from '@/components/features/auth/components/LoginForm';

export default function LoginPage() {
  const location = useLocation();
  const initialEmail = typeof location.state?.email === 'string' ? location.state.email : '';
  return (
    <section className={styles.cardPrincipal}>

      <div className={styles.cardCircular}>
        <User aria-hidden="true" className="size-12 text-[#2563eb]" strokeWidth={1.75} />
      </div>

      <h1>Iniciar sesión</h1>
      <p className="text-secundario">Ingresá tus credenciales para acceder a Centinela</p>
      <LoginForm initialEmail={initialEmail} />
      
    </section>
  );
}

const styles = {
  cardPrincipal: "flex min-h-[650px] w-full max-w-[620px] flex-col items-center justify-center gap-5 rounded-[12px] border border-[#e2e8f0] bg-white px-6 py-10 text-center shadow-[4px_4px_4px_0px_#0000001a] sm:px-15",
  cardCircular: "mb-5 flex h-25 w-25 items-center justify-center rounded-full bg-[#bfdbfe]",
}
