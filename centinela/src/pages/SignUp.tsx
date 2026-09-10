import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { ShieldCheck, UserRoundPlus } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox"

export default function SignUp() {
    return (
        <div className={styles.cardPrincipal}>
            <div className={styles.icono}>
                <UserRoundPlus aria-hidden="true" className="size-12 text-[#2563eb]" strokeWidth={1.75} />
            </div>
            <h1>Crear tu organización</h1>
            <p className="text-secundario">Creá tu organización y tu cuenta de admistrador en Centinela</p>

            <div className={styles.cardInformativa}>
                <ShieldCheck aria-hidden="true" className="size-10"/>
                <label>Serás el administrador inicial de esta organizacion y tendrás acceso completo para administrar usuarios, roles, permisos e instancias.</label>
            </div>

            <form className={styles.formulario}>
                <div className={styles.campo}>
                    <label htmlFor="nombre">Nombre completo</label>
                    <Input type="nombre" placeholder="Ej: Juan Pérez" />
                </div>

                <div className={styles.campo}>
                    <label htmlFor="email">Correo electrónico</label>
                    <Input type="email" placeholder="Ej: juan@ejemplo.com" />
                </div>

                <div className={styles.campo}>
                    <label htmlFor="organizacion">Nombre de la organización</label>
                    <Input type="organizacion" placeholder="Ej: Mi Organización, Universidad, DevOps Team" />
                    <p className="text-caption">Este nombre será visible para todos los usuarios de tu organización.</p>
                </div>

                <div className={styles.camposHorizontales}>
                    <div className={styles.campo}>
                        <label htmlFor="password">Contraseña</label>
                        <Input type="password" placeholder="Contraseña" />
                    </div>

                    <div className={styles.campo}>
                        <label htmlFor="password-confirm">Repetir contraseña</label>
                        <Input type="password" placeholder="Repetir contraseña" />
                    </div>
                </div>

                <div className="flex items-center gap-2 pb-3">
                    <Checkbox id="terminos" />
                    <label htmlFor="terminos">Acepto los Términos de servicio y la Política de privacidad</label>
                </div>

                <Button type="submit" className="w-full">Crear organización y continuar</Button>

                <p className="text-secundario">¿Ya tenés una cuenta? <a href="#" className="text-info"> Inicia sesión</a></p>
            </form>
        </div>
    )
}

const styles = {
  cardPrincipal: "flex flex-col items-center space-y-3 rounded-[12px] border border-[#e2e8f0] bg-white px-15 py-10 text-center shadow-[4px_4px_4px_0px_#0000001a]",
  cardInformativa: "flex w-[500px] items-start gap-3 rounded-[8px] border border-[#bfdbfe] bg-[#eff6ff] p-4 text-left",
  formulario: "flex w-[500px] max-w-full min-w-0 flex-1 basis-0 flex-col justify-center gap-3 text-center",
  campo: "flex w-full flex-col gap-3 text-left pb-3",
  camposHorizontales: "grid w-full grid-cols-2 gap-5",
  icono: " flex h-25 w-25 items-center justify-center self-center rounded-full bg-[#bfdbfe]",
};
