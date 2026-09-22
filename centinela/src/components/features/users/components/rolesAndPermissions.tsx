import {
    CheckCircle2,
    Container,
    Database,
    Eye,
    LockKeyhole,
    Monitor,
    Search,
    ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { InfoCard } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/nativeSelected';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type AccessLevel = 'Acceso completo' | 'Solo lectura' | 'Sin acceso';

interface InstanceAccess {
    name: string;
    type: 'VM' | 'LXC';
    access: AccessLevel;
    selected: boolean;
}

const instances: InstanceAccess[] = [
    { name: 'Ubuntu Server (101)', type: 'VM', access: 'Acceso completo', selected: true },
    { name: 'Desarrollo (104)', type: 'LXC', access: 'Acceso completo', selected: true },
    { name: 'Base de datos (108)', type: 'VM', access: 'Sin acceso', selected: false },
    { name: 'Web Producción (110)', type: 'LXC', access: 'Solo lectura', selected: true },
    { name: 'Windows 11 (112)', type: 'VM', access: 'Sin acceso', selected: false },
    { name: 'Backup Server (120)', type: 'LXC', access: 'Sin acceso', selected: false },
];

const accessOptions: AccessLevel[] = ['Acceso completo', 'Solo lectura', 'Sin acceso'];

export default function RolesAndPermissions() {
    return (
        <div className={styles.componentContainer}>
            <section className={styles.roleSection} aria-labelledby="user-role-title">
                <div className={styles.sectionHeading}>
                    <h4 id="user-role-title">Rol del usuario</h4>
                    <p className="text-secundario">El rol define el nivel de acceso y las acciones permitidas en el sistema.</p>
                </div>

                <div className={styles.roleContentGrid}>
                    <div>
                        <label htmlFor="assigned-role">Rol asignado</label>
                        <div className={styles.roleSelectContainer}>
                            <ShieldCheck className={styles.roleSelectIcon} aria-hidden="true" />
                            <NativeSelect id="assigned-role" defaultValue="standard" className={styles.roleSelect}>
                                <NativeSelectOption value="standard">Operador</NativeSelectOption>
                                <NativeSelectOption value="admin">Administrador</NativeSelectOption>
                                <NativeSelectOption value="viewer">Solo lectura</NativeSelectOption>
                            </NativeSelect>
                        </div>
                    </div>

                    <InfoCard>
                        Los permisos a instancias se aplican según el rol asignado.
                    </InfoCard>
                </div>
            </section>

            <section className={styles.instancesSection} aria-labelledby="instance-access-title">
                <div className={styles.sectionHeading}>
                    <h4 id="instance-access-title">Acceso a instancias</h4>
                    <p className="text-secundario">Definí a qué instancias puede acceder este usuario.</p>
                </div>

                <div className={styles.searchContainer}>
                    <Search className={styles.searchIcon} aria-hidden="true" />
                    <Input className={styles.searchInput} placeholder="Buscar instancia..." aria-label="Buscar instancia" />
                </div>

                <div className={styles.tableContainer}>
                    <Table className={styles.accessTable}>
                        <TableHeader>
                            <TableRow className={styles.tableHeaderRow}>
                                <TableHead className={styles.selectionColumn}>
                                    <span className="sr-only">Seleccionar</span>
                                </TableHead>
                                <TableHead className="header-of-table">Instancia</TableHead>
                                <TableHead className="header-of-table">Tipo</TableHead>
                                <TableHead className="header-of-table">Acceso</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {instances.map((instance) => (
                                <InstanceAccessRow key={instance.name} instance={instance} />
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className={styles.accessLegend}>
                    <AccessLegendItem
                        icon={CheckCircle2}
                        title="Acceso completo"
                        description="Puede ver y administrar"
                        iconClassName={styles.fullAccessIcon}
                    />
                    <AccessLegendItem
                        icon={Eye}
                        title="Solo lectura"
                        description="Puede ver, sin modificar"
                        iconClassName={styles.readOnlyIcon}
                    />
                    <AccessLegendItem
                        icon={LockKeyhole}
                        title="Sin acceso"
                        description="No tiene permisos"
                        iconClassName={styles.noAccessIcon}
                    />
                </div>
            </section>
        </div>
    );
}

function InstanceAccessRow({ instance }: { instance: InstanceAccess }) {
    const InstanceIcon = instance.name.startsWith('Base') ? Database : instance.type === 'VM' ? Monitor : Container;

    return (
        <TableRow className={styles.tableBodyRow}>
            <TableCell className={styles.selectionCell}>
                <Checkbox
                    defaultChecked={instance.selected}
                    aria-label={`Seleccionar ${instance.name}`}
                />
            </TableCell>
            <TableCell className={styles.instanceCell}>
                <InstanceIcon className={styles.instanceIcon} aria-hidden="true" />
                <p className="text-of-table">{instance.name}</p>
            </TableCell>
            <TableCell>
                <Badge className={instance.type === 'VM' ? styles.virtualMachineBadge : styles.containerBadge}>
                    {instance.type}
                </Badge>
            </TableCell>
            <TableCell className={styles.accessCell}>
                <div className={styles.accessSelectContainer}>
                    {instance.access === 'Solo lectura' && <Eye className={styles.readOnlySelectIcon} aria-hidden="true" />}
                    {instance.access === 'Sin acceso' && <LockKeyhole className={styles.noAccessSelectIcon} aria-hidden="true" />}
                    <NativeSelect
                        defaultValue={instance.access}
                        aria-label={`Acceso para ${instance.name}`}
                        className={instance.access === 'Acceso completo' ? styles.accessSelect : styles.accessSelectWithIcon}
                    >
                        {accessOptions.map((option) => (
                            <NativeSelectOption key={option} value={option}>{option}</NativeSelectOption>
                        ))}
                    </NativeSelect>
                </div>
            </TableCell>
        </TableRow>
    );
}

interface AccessLegendItemProps {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    iconClassName: string;
}

function AccessLegendItem({ icon: Icon, title, description, iconClassName }: AccessLegendItemProps) {
    return (
        <div className={styles.legendItem}>
            <Icon className={iconClassName} aria-hidden="true" />
            <div>
                <p className="body">{title}</p>
                <p className="text-secundario">{description}</p>
            </div>
        </div>
    );
}

const styles = {
    componentContainer: 'w-full divide-y divide-slate-200',
    roleSection: 'grid gap-5 p-5',
    instancesSection: 'grid gap-5 p-5',
    sectionHeading: 'min-w-0',
    roleContentGrid: 'grid grid-cols-1 items-end gap-5 lg:grid-cols-2',
    roleSelectContainer: 'relative',
    roleSelectIcon: 'pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-blue-600',
    roleSelect: 'w-full [&_select]:pl-10',
    searchContainer: 'relative',
    searchIcon: 'pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-slate-400',
    searchInput: 'pl-10',
    tableContainer: 'overflow-hidden rounded-lg border border-slate-200',
    accessTable: 'min-w-[42rem] text-xs text-slate-700',
    tableHeaderRow: 'bg-slate-50/80 hover:bg-slate-50/80',
    selectionColumn: 'w-12 pl-4',
    tableBodyRow: 'hover:bg-slate-50/70',
    selectionCell: 'pl-4',
    instanceCheckbox: 'size-4 data-checked:border-emerald-600 data-checked:bg-emerald-600 data-checked:text-white',
    instanceCell: 'flex items-center gap-3 font-medium',
    instanceIcon: 'size-5 shrink-0 text-slate-500',
    instanceName: 'text-slate-900',
    virtualMachineBadge: 'rounded-md border-0 bg-blue-50 px-2 text-[11px] font-medium text-blue-700',
    containerBadge: 'rounded-md border-0 bg-emerald-50 px-2 text-[11px] font-medium text-emerald-700',
    accessCell: 'pr-4',
    accessSelectContainer: 'relative',
    accessSelect: 'w-full',
    accessSelectWithIcon: 'w-full [&_select]:pl-9',
    readOnlySelectIcon: 'pointer-events-none absolute left-3 top-1/2 z-10 size-3.5 -translate-y-1/2 text-amber-500',
    noAccessSelectIcon: 'pointer-events-none absolute left-3 top-1/2 z-10 size-3.5 -translate-y-1/2 text-slate-500',
    accessLegend: 'grid grid-cols-1 divide-y divide-slate-200 border-y border-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0',
    legendItem: 'flex items-start gap-3 px-4 py-3',
    fullAccessIcon: 'mt-0.5 size-4 shrink-0 text-emerald-600',
    readOnlyIcon: 'mt-0.5 size-4 shrink-0 text-amber-500',
    noAccessIcon: 'mt-0.5 size-4 shrink-0 text-slate-500',
};
