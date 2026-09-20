import { useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronDown, Info, LockKeyhole, Monitor, Save, Shield, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const tabs = ['Información general', 'Roles y permisos', 'Actividad reciente', 'Sesiones activas', 'Seguridad'];
const permissions = [
    ['Ver dashboard', 'Puede ver el dashboard principal y el estado del sistema.', 'Permitido'],
    ['Ver instancias', 'Puede ver el listado y detalles de las instancias.', 'Permitido'],
    ['Detener instancias', 'Puede iniciar, detener y reiniciar instancias.', 'Permitido'],
    ['Crear instancias', 'Puede crear nuevas máquinas virtuales y contenedores.', 'Restringido'],
    ['Eliminar instancias', 'Puede eliminar instancias del sistema.', 'No permitido'],
    ['Gestionar usuarios', 'Puede crear y gestionar usuarios y roles.', 'No permitido'],
];

export default function UserDetail() {
    const [activeTab, setActiveTab] = useState(tabs[0]);

    return (
        <section className="flex min-w-0 flex-col gap-5 text-slate-900">
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div><p className="mb-2 text-xs text-slate-500">Usuarios <span className="mx-2">›</span> <strong className="text-slate-700">usuario2</strong></p><h1>Detalle / Edición de usuario</h1><p className="text-secundario">Gestioná la información, roles y permisos del usuario.</p></div>
                <div className="flex flex-wrap gap-3"><Button type="button" variant="outline"><ArrowLeft className="size-4!" /> Volver</Button><Button type="button" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50"><Trash2 className="size-4!" /> Eliminar usuario</Button><Button type="button" className="bg-blue-600 text-white hover:bg-blue-700"><Save className="size-4!" /> Guardar cambios</Button></div>
            </header>

            <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_18.5rem]">
                <div className="flex min-w-0 flex-col gap-4">
                    <Card className="gap-0 overflow-hidden rounded-xl border-slate-100 py-0 shadow-sm ring-0">
                        <nav className="flex overflow-x-auto border-b border-slate-100 px-5 pt-3" aria-label="Secciones del usuario">{tabs.map((tab) => <button type="button" key={tab} onClick={() => setActiveTab(tab)} className={`shrink-0 border-b-2 px-3 pb-3 text-xs font-medium transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{tab}</button>)}</nav>
                        {activeTab === 'Información general' && <GeneralTab />}
                        {activeTab === 'Roles y permisos' && <PermissionsTab />}
                        {activeTab !== 'Información general' && activeTab !== 'Roles y permisos' && <PlaceholderTab name={activeTab} />}
                    </Card>
                    {activeTab === 'Información general' && <InstancesAccess />}
                </div>
                <aside className="flex flex-col gap-4"><UserSummary /><SecurityCard /><ActivityCard /></aside>
            </div>
        </section>
    );
}

function GeneralTab() {
    return <div className="grid gap-5 p-5"><h2 className="m-0 text-base font-semibold">Información general</h2><div className="grid gap-5 md:grid-cols-2"><Field id="nombre" label="Nombre completo" value="Usuario Dos" /><Field id="usuario" label="Nombre de usuario" value="usuario2" /><Field id="email" label="Email" value="usuario2@propex.local" type="email" /><Field id="organizacion" label="Organización (solo lectura)" value="Universidad Nacional de Tierra del Fuego" readOnly /><div><label className="mb-2 block text-label" htmlFor="rol">Rol</label><select id="rol" className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option>Usuario estándar</option><option>Administrador</option><option>Solo lectura</option></select></div><label className="flex items-center justify-between text-label"><span>Usuario activo<small className="mt-1 block text-caption">El usuario puede acceder al sistema.</small></span><input type="checkbox" defaultChecked className="size-5 accent-blue-600" /></label></div><div className="border-t border-slate-100 pt-4"><div className="flex gap-2 rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-900"><Info className="size-4 shrink-0 text-blue-600" /> Los cambios en la información del usuario, roles o permisos pueden afectar el acceso al sistema.</div></div></div>;
}

function PermissionsTab() {
    return <div className="grid gap-5 p-5"><div><h2 className="m-0 text-base font-semibold">Rol del usuario</h2><p className="text-caption">El rol define el nivel de acceso y las acciones permitidas en el sistema.</p></div><div className="grid gap-3 md:grid-cols-2"><div><label className="mb-2 block text-label" htmlFor="rol-permisos">Rol asignado</label><select id="rol-permisos" className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option>Usuario estándar</option><option>Administrador</option><option>Solo lectura</option></select></div><div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-900"><Info className="size-4 shrink-0 text-blue-600" /> Los permisos se aplican según el rol asignado.</div></div><div className="grid gap-5 border-t border-slate-100 pt-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]"><div><h3 className="m-0 text-sm font-semibold">Permisos del rol</h3><p className="mb-4 text-caption">Permisos que incluye el rol Usuario estándar.</p><ul className="space-y-3">{permissions.map(([name, description, state]) => <li key={name} className="flex gap-2 text-xs"><Shield className="mt-0.5 size-4 shrink-0 text-slate-500" /><span className="min-w-0 flex-1"><strong className="block">{name}</strong><small className="text-caption">{description}</small></span><span className={`h-fit rounded px-2 py-1 text-[10px] ${state === 'Permitido' ? 'bg-green-50 text-green-700' : state === 'Restringido' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>{state}</span></li>)}</ul></div><AccessList /></div></div>;
}

function AccessList() { return <div><h3 className="m-0 text-sm font-semibold">Acceso a instancias</h3><p className="mb-4 text-caption">Definí a qué instancias puede acceder este usuario.</p><Input placeholder="Buscar instancia..." /><div className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200 text-xs">{['Ubuntu Server (101)', 'Desarrollo (104)', 'Base de datos (108)', 'Web Producción (110)', 'Windows 11 (112)', 'Backup Server (120)'].map((name, index) => <div key={name} className="flex items-center gap-2 p-3"><input type="checkbox" defaultChecked={index < 3} className="accent-blue-600" /><Monitor className="size-4 text-slate-500" /><span className="flex-1">{name}</span><select className="rounded border border-slate-200 bg-white px-2 py-1 text-[11px]"><option>{index < 3 ? 'Acceso completo' : 'Sin acceso'}</option><option>Solo lectura</option></select></div>)}</div></div>; }

function InstancesAccess() { return <Card className="gap-0 overflow-hidden rounded-xl border-slate-100 py-0 shadow-sm ring-0"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="m-0 text-base font-semibold">Acceso a instancias asignadas</h2><p className="text-caption">Definí a qué instancias puede acceder este usuario.</p></div><Button type="button" variant="outline">Gestionar acceso <ChevronDown className="size-4!" /></Button></div><div className="p-5 text-xs text-slate-600"><div className="grid grid-cols-4 gap-3 border-b border-slate-100 pb-2 font-medium text-slate-500"><span>Instancia</span><span>Tipo</span><span>Nodo</span><span>Estado</span></div>{['Ubuntu Server (101)', 'Desarrollo (104)', 'Base de datos (108)'].map((name, index) => <div key={name} className="grid grid-cols-4 gap-3 border-b border-slate-100 py-3"><span>{name}</span><span className="text-blue-600">{index === 1 ? 'LXC' : 'VM'}</span><span>pve01</span><span className="text-green-700">{index === 2 ? 'Sin acceso' : 'Activo'}</span></div>)}</div></Card>; }

function UserSummary() { return <Card className="gap-3 rounded-xl border-slate-100 p-4 shadow-sm ring-0"><h3 className="m-0 text-sm font-semibold">Resumen del usuario</h3><div className="flex items-center gap-3"><span className="flex size-12 items-center justify-center rounded-full bg-blue-50 text-xl font-semibold text-blue-600">U2</span><div><strong className="block">usuario2</strong><span className="text-caption">Usuario estándar</span><span className="mt-1 block text-caption">usuario2@propex.local</span><span className="mt-1 block text-caption">Creado el 03/05/2024, 11:22</span></div></div></Card>; }
function SecurityCard() { return <Card className="gap-3 rounded-xl border-slate-100 p-4 shadow-sm ring-0"><h3 className="m-0 text-sm font-semibold">Seguridad</h3>{[['Autenticación 2FA', 'Activado'], ['Último cambio de contraseña', '02/05/2024, 09:10'], ['Intentos de inicio fallidos', '0'], ['Bloqueado', 'No']].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3 text-xs"><span className="flex items-center gap-2 text-slate-600"><LockKeyhole className="size-4 text-slate-500" />{label}</span><strong className={value === 'Activado' ? 'text-green-700' : ''}>{value}</strong></div>)}</Card>; }
function ActivityCard() { return <Card className="gap-3 rounded-xl border-slate-100 p-4 shadow-sm ring-0"><h3 className="m-0 text-sm font-semibold">Actividad reciente</h3>{['Inició sesión correctamente', 'Inició instancia Windows 11 (102)', 'Tomó snapshot de Ubuntu Server (101)'].map((activity) => <div key={activity} className="flex gap-2 border-b border-slate-100 pb-3 text-xs"><CheckCircle2 className="size-4 shrink-0 text-green-600" /><span>{activity}<small className="mt-1 block text-caption">Hoy, 17:41</small></span></div>)}<a href="#actividad" className="text-xs font-medium text-blue-600">Ver toda la actividad →</a></Card>; }
function PlaceholderTab({ name }: { name: string }) { return <div className="flex min-h-48 items-center justify-center p-5 text-sm text-slate-400">Vista mock de {name}.</div>; }
function Field({ id, label, value, type = 'text', readOnly = false }: { id: string; label: string; value: string; type?: string; readOnly?: boolean }) { return <div><label className="mb-2 block text-label" htmlFor={id}>{label}</label><Input id={id} value={value} type={type} readOnly={readOnly} onChange={() => undefined} /></div>; }
