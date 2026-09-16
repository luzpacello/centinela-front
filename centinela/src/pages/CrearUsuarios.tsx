import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';

export default function CrearUsuarios() {
  return (
    //Seccion Informacion del usuario
    <div className={styles.cardPrincipal}>
      <h4>Información del usuario</h4>

      {/* Seccion de nombre y usuario */}
      <div className={styles.dobleInputContainer}>
        <div id="formulario-nombre" className={styles.formulario}>
          <label htmlFor="nombre">Nombre completo</label>
          <Input id="nombre" placeholder="Ej: Juan Pérez" />
        </div>

        <div id="formulario-usuario" className={styles.formulario}>
          <label htmlFor="usuario">Nombre de usuario</label>
          <Input id="usuario" placeholder="Ej: juanperez" />
          <label className={styles.textoHelper}>
            Será utilizado para iniciar sesión en la plataforma.
          </label>
        </div>
      </div>


      {/* Seccion de correo y confirmacion */}
      <div className={styles.dobleInputContainer}>
        <div id="formulario-correo" className={styles.formulario}>
          <label htmlFor="correo">Correo electrónico</label>
          <Input id="correo" placeholder="Ej: juan.perez@example.com" />
          <label className={styles.textoHelper}>
            El usuario recibirá un correo con sus credenciales.
          </label>
        </div>

        <div id="formulario-correo-confirmacion" className={styles.formulario}>
          <label htmlFor="correo-confirmacion">Confirmar correo electrónico</label>
          <Input id="correo-confirmacion" placeholder="Repetí el correo electrónico" />
        </div>
      </div>


      {/* Seccion de contraseña y confirmacion */}
      <div className={styles.dobleInputContainer}>
        <div id="formulario-contrasena" className={styles.formulario}>
          <label htmlFor="contrasena">Contraseña</label>
          <Input id="contrasena" type="password" placeholder="Generara automáticamente o escribe una temporal" />
        </div>

        <div id="formulario-contrasena-confirmacion" className={styles.formulario}>
          <label htmlFor="contrasena-confirmacion">Confirmar contraseña</label>
          <Input id="contrasena-confirmacion" type="password" placeholder="Confirmá la contraseña" />
        </div>
      </div>

      {/* Rol de usuario */}


      {/* Boton de confirmacion */}
      <Button type="submit" variant="secondary">Cancelar</Button>
      <Button type="submit">Crear usuario</Button>
    </div>
  );
}

const styles = {
  cardPrincipal: "space-y-5 rounded-[12px] border border-[#e2e8f0] bg-white p-6 shadow-[4px_4px_4px_0px_#0000001a]",
  formulario: "flex min-w-0 flex-1 basis-0 flex-col gap-3",
  textoHelper: "font-[family-name:'JetBrains_Mono',monospace] text-[12px] leading-[1.2] font-normal tracking-normal text-[#64748b] [text-rendering:geometricPrecision]",

  dobleInputContainer: "flex flex-horizontal gap-5",
};
