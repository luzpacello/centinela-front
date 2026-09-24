import { FieldError } from '@/components/ui/field';
import { Building2, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/nativeSelected';
import { Switch } from '@/components/ui/switch';
import type { EditableUserValues, UpdateEditableUserField } from '../types/user';

interface InformationOfUserProps {
    values: EditableUserValues;
    onFieldChange: UpdateEditableUserField;
    emailError?: string;
}

export default function InformationOfUser({ values, onFieldChange, emailError }: InformationOfUserProps) {
    return (
        <section className={styles.informationSection} aria-labelledby="general-information-title">
            <h4 id="general-information-title">Información general</h4>

            <div className={styles.fieldsGrid}>
                <InputField
                    id="full-name"
                    label="Nombre completo"
                    value={values.nombreCompleto}
                    onChange={(value) => onFieldChange('nombreCompleto', value)}
                    icon={UserRound}
                />
                <InputField
                    id="email"
                    label="Correo electrónico"
                    value={values.emailUsuario}
                    onChange={(value) => onFieldChange('emailUsuario', value)}
                    error={emailError}
                    type="email"
                    icon={Mail}
                />
                <InputField
                    id="organization"
                    label="Organización (solo lectura)"
                    value={values.organizacionId}
                    icon={Building2}
                    readOnly
                />

                <div className={styles.fieldContainer}>
                    <label htmlFor="user-role">Rol</label>
                    <div className={styles.controlWithIcon}>
                        <ShieldCheck className={styles.controlIcon} aria-hidden="true" />
                        <NativeSelect
                            id="user-role"
                            value={values.rol}
                            onChange={(event) => onFieldChange('rol', event.target.value)}
                            className={styles.roleSelect}
                        >
                            <NativeSelectOption value="OPERATOR">Operador</NativeSelectOption>
                            <NativeSelectOption value="ADMIN">Administrador</NativeSelectOption>
                            <NativeSelectOption value="READ_ONLY">Solo lectura</NativeSelectOption>
                        </NativeSelect>
                    </div>
                </div>

                <div className={styles.activeUserContainer}>
                    <div className={styles.activeUserTextContainer}>
                        <label htmlFor="active-user">Usuario activo</label>
                        <p className="text-secundario">El usuario puede acceder al sistema.</p>
                    </div>
                    <Switch
                        id="active-user"
                        checked={values.activo}
                        onCheckedChange={(checked) => onFieldChange('activo', checked)}
                        aria-label="Usuario activo"
                        className={styles.activeUserSwitch}
                    />
                </div>
            </div>
        </section>
    );
}

interface InputFieldProps {
    id: string;
    label: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    type?: string;
    readOnly?: boolean;
    error?: string;
    onChange?: (value: string) => void;
}

function InputField({ id, label, value, icon: Icon, type = 'text', readOnly = false, onChange, error }: InputFieldProps) {
    return (
        <div className={styles.fieldContainer}>
            <label htmlFor={id}>{label}</label>
            <div className={styles.controlWithIcon}>
                <Icon className={styles.controlIcon} aria-hidden="true" />
                <Input
                    id={id}
                    type={type}
                    value={value}
                    readOnly={readOnly}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${id}-error` : undefined}
                    onChange={(event) => onChange?.(event.target.value)}
                    className={styles.textInput}
                />
            </div>
            {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
        </div>
    );
}

const styles = {
    informationSection: 'grid gap-5 p-5',
    fieldsGrid: 'grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2',
    fieldContainer: 'min-w-0',
    controlWithIcon: 'relative',
    controlIcon: 'pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-slate-500',
    textInput: 'pl-10',
    roleSelect: 'w-full [&_select]:pl-10',
    activeUserContainer: 'flex min-h-16 items-center justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3 md:col-span-2',
    activeUserTextContainer: 'flex min-w-0 flex-col',
    activeUserDescription: 'bg-background text-foreground antialiased text-sm font-normal',
    activeUserSwitch: 'data-checked:bg-emerald-600',
};
