import { ArrowLeft, Check, CheckCircle2, Eye, Info, Shield, UserRound, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface RoleOption {
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
}

const roles: RoleOption[] = [
    { name: 'Usuario', description: 'Acceso básico para gestionar y visualizar recursos asignados.', icon: UserRound },
    { name: 'Administrador', description: 'Acceso completo para gestionar recursos y usuarios.', icon: Shield },
    { name: 'Solo lectura', description: 'Puede visualizar recursos pero no realizar cambios.', icon: Eye },
];

export default function CrearUsuarios() {
    return (
        <section className={style.page}>
            <header>
                <h1>Crear usuario</h1>
                <p className="text-secundario">Agregá un nuevo usuario a tu organización.</p>
            </header>

            <Button type="button" variant="outline" className={style.backButton}>
                <ArrowLeft className={style.smallIcon} /> Volver a usuarios
            </Button>

            <div className={style.mainGrid}>
                <Card className={style.formCard}>
                    <div className={style.formHeader}>
                        <h2 className="m-0 text-base font-semibold">Información del usuario</h2>
                    </div>
                    <form className={style.formContent} onSubmit={(event: React.FormEvent<HTMLFormElement>) => event.preventDefault()}>
                        <div className={style.formFieldsGrid}>
                            <FormField id="nombre" label="Nombre completo" required placeholder="Ej: Juan Pérez" />
                            <FormField id="usuario" label="Nombre de usuario" required placeholder="Ej: juanperez" hint="Será utilizado para iniciar sesión en la plataforma." />
                            <FormField id="correo" label="Correo electrónico" required type="email" placeholder="Ej: juan.perez@propex.local" hint="El usuario recibirá un correo con sus credenciales." />
                            <FormField id="confirmar-correo" label="Confirmar correo electrónico" required type="email" placeholder="Repetí el correo electrónico" />
                            <div>
                                <label className="mb-2 block text-label" htmlFor="contrasena">
                                    Contraseña temporal <span className="text-red-500">*</span>
                                </label>
                                <div className="flex gap-2">
                                    <Input id="contrasena" type="password" placeholder="Generar automáticamente" />
                                    <Button type="button" variant="outline" className="shrink-0 text-blue-600">Generar</Button>
                                </div>
                                <p className="mt-2 text-caption">El usuario deberá cambiar esta contraseña en su primer inicio de sesión.</p>
                            </div>
                            <FormField id="confirmar-contrasena" label="Confirmar contraseña temporal" required type="password" placeholder="Confirmá la contraseña" />
                        </div>

                        <div className="max-w-md">
                            <label className="mb-2 block text-label" htmlFor="rol">
                                Rol del usuario <span className="text-red-500">*</span>
                            </label>
                            <select id="rol" className={style.selectInput}>
                                <option>Usuario</option>
                                <option>Administrador</option>
                                <option>Solo lectura</option>
                            </select>
                            <p className="mt-2 text-caption">Definí el rol que tendrá el usuario dentro de la organización.</p>
                        </div>

                        <label className="flex items-center gap-3 text-label" htmlFor="activo">
                            <input id="activo" type="checkbox" defaultChecked className={style.checkbox} /> Estado: Activo
                        </label>

                        <div className={style.formActions}>
                            <Button type="button" variant="outline">Cancelar</Button>
                            <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
                                <UserRound className={style.smallIcon} /> Crear usuario
                            </Button>
                        </div>
                    </form>
                </Card>

                <aside className={style.asideContainer}>
                    <Card className={style.roleCard}>
                        <h3 className="m-0 text-sm font-semibold">Roles disponibles</h3>
                        {roles.map(({ name, description, icon: Icon }, index) => {
                            const isSelected = index === 0;
                            return (
                                <div key={name} className={`${style.roleItem} ${isSelected ? 'border-blue-200 bg-blue-50/60' : 'border-transparent'}`}>
                                    <span className={`${style.roleIconBox} ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                                        <Icon className="size-4" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold">{name}</p>
                                        <p className="mt-1 text-caption">{description}</p>
                                    </div>
                                    {isSelected && <CheckCircle2 className="ml-auto size-4 shrink-0 text-blue-600" />}
                                </div>
                            );
                        })}
                    </Card>

                    <Card className={style.roleCard}>
                        <h3 className="m-0 text-sm font-semibold">Permisos del rol seleccionado</h3>
                        <div className={style.selectedRoleBadge}>
                            <UserRound className="size-4 text-blue-600" /> Usuario <span className="ml-auto text-[11px] text-blue-600">Rol seleccionado</span>
                        </div>
                        <ul className="space-y-2 text-xs text-slate-600">
                            {['Ver dashboard', 'Gestionar instancias propias', 'Ver plantillas y almacenamiento', 'Gestionar snapshots y backups propios', 'Ver red'].map((permission) => (
                                <li key={permission} className="flex gap-2">
                                    <Check className="size-4 text-blue-600" />{permission}
                                </li>
                            ))}
                            {['Gestionar usuarios', 'Gestionar configuración global', 'Acceso a auditoría'].map((permission) => (
                                <li key={permission} className="flex gap-2 text-slate-400">
                                    <X className="size-4" />{permission}
                                </li>
                            ))}
                        </ul>
                    </Card>

                    <div className={style.infoBox}>
                        <Info className="size-4 shrink-0 text-blue-600" />
                        <span>Asigná el rol adecuado según las responsabilidades del usuario.</span>
                    </div>
                </aside>
            </div>
        </section>
    );
}

interface FormFieldProps {
    id: string;
    label: string;
    placeholder: string;
    hint?: string;
    type?: string;
    required?: boolean;
}

function FormField({ id, label, placeholder, hint, type = 'text', required = false }: FormFieldProps) {
    return (
        <div>
            <label className="mb-2 block text-label" htmlFor={id}>
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <Input id={id} type={type} placeholder={placeholder} />
            {hint && <p className="mt-2 text-caption">{hint}</p>}
        </div>
    );
}

const style = {
    page: 'flex min-w-0 flex-col gap-5 text-slate-900',
    backButton: 'w-full justify-start border-slate-100 bg-white text-xs text-blue-600 shadow-sm hover:text-blue-700',
    mainGrid: 'grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]',
    formCard: 'gap-0 overflow-hidden rounded-xl border-slate-100 py-0 shadow-sm ring-0',
    formHeader: 'border-b border-slate-100 px-5 py-4',
    formContent: 'grid gap-5 p-5',
    formFieldsGrid: 'grid grid-cols-1 gap-5 md:grid-cols-2',
    selectInput: 'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-600',
    checkbox: 'size-4 accent-blue-600',
    formActions: 'flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5',
    asideContainer: 'flex flex-col gap-4',
    roleCard: 'gap-3 rounded-xl border-slate-100 p-4 shadow-sm ring-0',
    roleItem: 'flex gap-3 rounded-lg border p-3',
    roleIconBox: 'flex size-8 shrink-0 items-center justify-center rounded-full',
    selectedRoleBadge: 'flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50/60 p-3 text-sm font-medium',
    infoBox: 'flex gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-900',
    smallIcon: 'size-4!',
};