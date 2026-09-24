import { useState } from 'react';
import { ArrowLeft, Check, CheckCircle2, ChevronRight, Eye, Info, Shield, UserPlus, UserRound, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/nativeSelected';
import { ConfirmUserAction } from '@/components/common/ConfirmUserAction';
import { useCreateUser } from '@/components/features/createuser/hooks/useCreateUser';
import { useSafeNavigate } from '@/hooks/useSafeNavigate';

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

const EMPTY_FORM = { nombreCompleto: '', nombreUsuario: '', emailUsuario: '', rol: 'OPERATOR' };

export default function CrearUsuarios() {
    const navigate = useSafeNavigate();
    const goBack = () => window.history.back();
    const [form, setForm] = useState(EMPTY_FORM);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
    const [emailConfirmation, setEmailConfirmation] = useState('');
    const { submitNewUser } = useCreateUser();

    function updateField(field: keyof typeof EMPTY_FORM, value: string) {
        setForm((previous) => ({ ...previous, [field]: value }));
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage(null);
        if (form.emailUsuario !== emailConfirmation) {
            setErrorMessage('Los correos electrónicos no coinciden.');
            return;
        }
        setIsConfirmationOpen(true);
    }

    function cancelCreation() {
        setIsConfirmationOpen(false);
        setForm(EMPTY_FORM);
        setEmailConfirmation('');
        setErrorMessage(null);
    }

    async function confirmCreation() {
        setIsConfirmationOpen(false);
        const wasCreated = await submitNewUser(form);
        if (!wasCreated) return;
        setForm(EMPTY_FORM);
        setEmailConfirmation('');
        setErrorMessage(null);
        navigate('/users');
    }

    return (
        <section className={style.page}>
            {isConfirmationOpen && <ConfirmUserAction title="Crear usuario" description={`Se creará la cuenta de ${form.nombreCompleto} y se enviarán sus credenciales a ${form.emailUsuario}.`} onCompleted={() => undefined} onConfirm={confirmCreation} onCancel={cancelCreation} />}
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
                <Card>
                    <div className={style.formHeader}>
                        <h4>Información del usuario</h4>
                    </div>
                    <form className={style.formContent} onSubmit={handleSubmit}>
                        <div className={style.formFieldsGrid}>
                            <FormField id="nombre" label="Nombre completo" required placeholder="Ej: Juan Pérez" value={form.nombreCompleto} onChange={(value) => updateField('nombreCompleto', value)} />
                            <FormField id="usuario" label="Nombre de usuario" required placeholder="Ej: juanperez"  value={form.nombreUsuario} onChange={(value) => updateField('nombreUsuario', value)} />
                            <FormField id="correo" label="Correo electrónico" required type="email" placeholder="Ej: juan.perez@propex.local" hint="El usuario recibirá un correo con sus credenciales." value={form.emailUsuario} onChange={(value) => updateField('emailUsuario', value)} />
                            <FormField id="confirmar-correo" label="Confirmar correo electrónico" required type="email" placeholder="Repetí el correo electrónico" value={emailConfirmation} onChange={setEmailConfirmation} />

                        </div>

                        <Field className="max-w-md">
                            <FieldLabel htmlFor="rol">
                                Rol del usuario <span className="text-red-500">*</span>
                            </FieldLabel>
                            <NativeSelect id="rol" value={form.rol} onChange={(event) => updateField('rol', event.target.value)}>
                                <NativeSelectOption value="ADMIN">Administrador</NativeSelectOption>
                                <NativeSelectOption value="OPERATOR">Operador</NativeSelectOption>
                            </NativeSelect>
                            <FieldDescription className="text-caption">Definí el rol que tendrá el usuario dentro de la organización.</FieldDescription>
                        </Field>

                        {errorMessage && (
                            <FieldError className="text-xs">{errorMessage}</FieldError>
                        )}

                        <div className={style.formActions}>
                            <Button type="button" variant="outline" onClick={() => navigate('/users')}>Cancelar</Button>
                            <Button type="submit" disabled={isConfirmationOpen}>
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
        <Field>
            <FieldLabel htmlFor={id}>
                {label}
                {required && <span className="text-red-500" aria-hidden="true">*</span>}
            </FieldLabel>
            <Input
                id={id}
                type={type}
                required={required}
                placeholder={placeholder}
                value={value}
                onChange={onChange ? (event) => onChange(event.target.value) : undefined}
            />
            {hint && <FieldDescription className="text-caption">{hint}</FieldDescription>}
        </Field>
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
    formHeader: 'px-5 pt-5',
    formContent: 'grid gap-5 p-5',
    formFieldsGrid: 'grid grid-cols-1 gap-5 md:grid-cols-2',
    selectInput: 'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-600',
    checkbox: 'size-4 accent-blue-600',
    formActions: 'flex flex-wrap justify-end gap-3 pt-5',
    asideContainer: 'flex flex-col gap-4',
    roleCard: 'gap-3 rounded-xl border-slate-100 p-4 shadow-sm ring-0',
    roleItem: 'flex gap-3 rounded-lg border p-3',
    roleIconBox: 'flex size-8 shrink-0 items-center justify-center rounded-full',
    selectedRoleBadge: 'flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50/60 p-3 text-sm font-medium',
    infoBox: 'flex gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-900',
    smallIcon: 'size-4!',
};
