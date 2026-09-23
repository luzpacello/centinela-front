import { useState } from 'react';
import { ArrowLeft, Check, CheckCircle2, ChevronRight, Copy, Eye, Info, Shield, UserPlus, UserRound, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ApiRequestError, apiClient } from '@/services/apiClient';
import { useSafeNavigate } from '@/hooks/useSafeNavigate';

interface RoleOption {
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
}

// Respuesta 201 de POST /api/admin/users según el contrato de Swagger.
interface CreatedUser {
    id: string;
    rol: string;
    activo: boolean;
    contrasenaTemp?: string | null;
}

const roles: RoleOption[] = [
    { name: 'Usuario', description: 'Acceso básico para gestionar y visualizar recursos asignados.', icon: UserRound },
    { name: 'Administrador', description: 'Acceso completo para gestionar recursos y usuarios.', icon: Shield },
    { name: 'Solo lectura', description: 'Puede visualizar recursos pero no realizar cambios.', icon: Eye },
];

const EMPTY_FORM = { nombreCompleto: '', nombreUsuario: '', emailUsuario: '', rol: 'OPERATOR' };

export default function CrearUsuarios() {
    const navigate = useSafeNavigate();
    const goBack = () => window.history.back();
    const [form, setForm] = useState(EMPTY_FORM);
    const [tempPassword, setTempPassword] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    function updateField(field: keyof typeof EMPTY_FORM, value: string) {
        setForm((previous) => ({ ...previous, [field]: value }));
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage(null);
        setTempPassword(null);
        setIsSubmitting(true);
        try {
            // El backend genera la contraseña temporal y devuelve `contrasenaTemp`.
            const created = await apiClient.post<CreatedUser>('/admin/users', {
                nombreCompleto: form.nombreCompleto,
                nombreUsuario: form.nombreUsuario,
                emailUsuario: form.emailUsuario,
                rol: form.rol,
            });
            setTempPassword(created.contrasenaTemp ?? null);
        } catch (error) {
            setErrorMessage(
                error instanceof ApiRequestError
                    ? error.message
                    : 'No se pudo crear el usuario. Intentá nuevamente.',
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleCopyPassword() {
        if (!tempPassword) return;
        try {
            await navigator.clipboard?.writeText(tempPassword);
            setIsCopied(true);
        } catch {
            setIsCopied(false);
        }
    }

    return (
        <section className={style.page}>
            <header className={style.pageHeader}>
                <div className={style.headingContainer}>
                    <nav className={style.breadcrumb} aria-label="Navegación secundaria">
                        <span>Usuarios</span>
                        <ChevronRight className={style.breadcrumbIcon} aria-hidden="true" />
                        <span className={style.currentPageName}>Crear usuario</span>
                    </nav>
                    <h1>Crear usuario</h1>
                    <p className="text-secundario">Agregá un nuevo usuario a tu organización.</p>
                </div>

                <div className={style.headerActions}>
                    <Button type="button" variant="outline" onClick={goBack}>
                        <ArrowLeft className={style.smallIcon} aria-hidden="true" />
                        Volver
                    </Button>
                </div>
            </header>

            <div className={style.mainGrid}>
                <Card className={style.formCard}>
                    <div className={style.formHeader}>
                        <h2 className="m-0 text-base font-semibold">Información del usuario</h2>
                    </div>
                    <form className={style.formContent} onSubmit={handleSubmit}>
                        <div className={style.formFieldsGrid}>
                            <FormField id="nombre" label="Nombre completo" required placeholder="Ej: Juan Pérez" value={form.nombreCompleto} onChange={(value) => updateField('nombreCompleto', value)} />
                            <FormField id="usuario" label="Nombre de usuario" required placeholder="Ej: juanperez" hint="Será utilizado para iniciar sesión en la plataforma." value={form.nombreUsuario} onChange={(value) => updateField('nombreUsuario', value)} />
                            <FormField id="correo" label="Correo electrónico" required type="email" placeholder="Ej: juan.perez@propex.local" hint="El usuario recibirá un correo con sus credenciales." value={form.emailUsuario} onChange={(value) => updateField('emailUsuario', value)} />
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
                            <select id="rol" className={style.selectInput} value={form.rol} onChange={(event) => updateField('rol', event.target.value)}>
                                <option value="ADMIN">ADMIN</option>
                                <option value="OPERATOR">OPERATOR</option>
                            </select>
                            <p className="mt-2 text-caption">Definí el rol que tendrá el usuario dentro de la organización.</p>
                        </div>

                        <label className="flex items-center gap-3 text-label" htmlFor="activo">
                            <input id="activo" type="checkbox" defaultChecked className={style.checkbox} /> Estado: Activo
                        </label>

                        {errorMessage && (
                            <p role="alert" className="text-xs text-red-600">{errorMessage}</p>
                        )}

                        {tempPassword && (
                            <div className={style.tempPasswordBox} role="status">
                                <p className="text-label">Contraseña temporal generada</p>
                                <div className="flex items-center gap-2">
                                    <code className={style.tempPasswordValue}>{tempPassword}</code>
                                    <Button type="button" variant="outline" size="sm" onClick={handleCopyPassword}>
                                        <Copy className={style.smallIcon} /> {isCopied ? 'Copiada' : 'Copiar'}
                                    </Button>
                                </div>
                                <p className="mt-2 text-caption">Guardala y compartila con el usuario: el backend no vuelve a mostrarla.</p>
                            </div>
                        )}

                        <div className={style.formActions}>
                            <Button type="button" variant="outline" onClick={() => navigate('/users')}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                <UserPlus className="size-4!" />  Crear usuario
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
    value?: string;
    onChange?: (value: string) => void;
}

function FormField({ id, label, placeholder, hint, type = 'text', required = false, value, onChange }: FormFieldProps) {
    return (
        <div>
            <div className="mb-2 flex items-center gap-1">
                <label className="text-label" htmlFor={id}>{label}</label>
                {required && <span className="text-red-500" aria-hidden="true">*</span>}
            </div>
            <Input
                id={id}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange ? (event) => onChange(event.target.value) : undefined}
            />
            {hint && <p className="mt-2 text-caption">{hint}</p>}
        </div>
    );
}

const style = {
    page: 'flex min-w-0 flex-col gap-5 text-slate-900',
    pageHeader: 'flex flex-col items-start justify-between gap-5 lg:flex-row',
    headingContainer: 'min-w-0',
    breadcrumb: 'mb-3 flex items-center gap-1.5 text-xs text-slate-500',
    breadcrumbIcon: 'size-3.5',
    currentPageName: 'font-semibold text-slate-900',
    headerActions: 'flex w-full flex-wrap gap-3 lg:w-auto lg:justify-end',
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
    tempPasswordBox: 'grid gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4',
    tempPasswordValue: 'flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 font-mono text-sm text-emerald-800',
    infoBox: 'flex gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-900',
    smallIcon: 'size-4!',
};
