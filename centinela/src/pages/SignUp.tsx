import { ShieldCheck, UserRoundPlus } from 'lucide-react';
import OrganizationRegistrationForm from '@/components/features/auth/components/OrganizationRegistrationForm';

export default function SignUpPage() {
  return (
    <section className={styles.cardPrincipal}>
      <div className={styles.carIcon}>
        <UserRoundPlus aria-hidden="true" className="size-12 text-[#2563eb]" strokeWidth={1.75} />
      </div>

      <h1>Crear tu organización</h1>
      <p className="text-secundario">Creá tu organización y tu cuenta de administrador en Centinela</p>
      
      <div className={styles.cardInformacion}>
        <ShieldCheck aria-hidden="true" className="size-10 shrink-0" />
        <p>Serás el administrador inicial de esta organización y tendrás acceso completo para administrar usuarios, roles, permisos e instancias.</p>
      </div>
      
      <OrganizationRegistrationForm />
    </section>
  );
}

const styles = {
  cardPrincipal: "flex w-full max-w-[620px] flex-col items-center gap-5 rounded-[12px] border border-[#e2e8f0] bg-white px-6 py-10 text-center shadow-[4px_4px_4px_0px_#0000001a] sm:px-15",
  carIcon: "flex h-25 w-25 items-center justify-center rounded-full bg-[#bfdbfe]",
  cardInformacion: "flex w-full items-start gap-3 rounded-[8px] border border-[#bfdbfe] bg-[#eff6ff] p-4 text-left"
}
