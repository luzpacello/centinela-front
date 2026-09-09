import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { User } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox"

export default function Login() {
    return (
        <div className={styles.cardPrincipal}>
            <div className={styles.icono}>
                <User aria-hidden="true" className="size-12 text-[#2563eb]" strokeWidth={1.75} />
            </div>
            <h1>Iniciar sesión</h1>
            <p className="text-secundario">Ingresá tus credenciales para acceder a Centinela</p>

            <form className={styles.formulario}>
                <div className={styles.campo}>
                    <label htmlFor="email">Correo electrónico</label>
                    <Input type="email" placeholder="Correo electrónico" />
                </div>

                <div className={styles.campo}>
                    <label htmlFor="password">Contraseña</label>
                    <Input type="password" placeholder="Contraseña" />
                </div>

                <div className="flex w-full items-center justify-between pb-3">
                    <div className="flex items-center gap-2">
                        <Checkbox id="recordarme" />
                        <label htmlFor="recordarme">Recordarme</label>
                    </div>
                    <a href="#" className="text-info">¿Olvidaste tu contraseña?</a>
                </div>

                <Button type="submit" className="w-full">Iniciar sesión</Button>

                <p className="text-secundario">¿No tenés una cuenta? <a href="#" className="text-info"> Contactá al administrador</a></p>
            </form>

        </div>
    )
}

const styles = {
  cardPrincipal: "flex h-[650px] flex-col items-center space-y-5 rounded-[12px] border border-[#e2e8f0] bg-white px-15 py-10 text-center shadow-[4px_4px_4px_0px_#0000001a]",
  formulario: "flex w-[500px] max-w-full min-w-0 flex-1 basis-0 flex-col justify-center gap-3 text-center",
  campo: "flex w-full flex-col gap-3 text-left pb-3",
  icono: "mb-10 flex h-25 w-25 items-center justify-center self-center rounded-full bg-[#bfdbfe]",
};
