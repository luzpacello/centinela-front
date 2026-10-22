import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/toast';
import { useInstances } from '@/components/features/instances/hooks/useInstances';
import { InstanceTypeBadge, InstanceStatusBadge } from '@/components/features/instances/components/InstanceBadges';
import InstanceAction from '@/components/features/instances/components/InstanceAction';
import { Container, Monitor } from 'lucide-react';

type DetailTab = 'resumen' | 'recursos' | 'configuracion';

function MetricCard({
  title,
  value,
  subtitle,
  percentage,
  color = 'green',
}: {
  title: string;
  value: string;
  subtitle: string;
  percentage?: number | null;
  color?: 'green' | 'blue' | 'orange';
}) {
  const colors = {
    green: {
      text: 'text-emerald-700',
      bar: 'bg-emerald-600',
      icon: 'text-emerald-700',
    },
    blue: {
      text: 'text-blue-700',
      bar: 'bg-blue-600',
      icon: 'text-blue-700',
    },
    orange: {
      text: 'text-orange-600',
      bar: 'bg-orange-500',
      icon: 'text-orange-600',
    },
  } as const;

  const theme = colors[color];
  const hasValue =
    percentage !== null &&
    percentage !== undefined &&
    Number.isFinite(percentage);

  return (
    <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-slate-600">{title}</h3>
        <span className={`text-lg ${theme.icon}`} aria-hidden="true">
          {color === 'green' ? '▥' : color === 'blue' ? '▤' : '▧'}
        </span>
      </div>

      <p className={`mt-3 text-3xl font-semibold tracking-tight ${theme.text}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>

      {hasValue ? (
        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-label={`${title}: ${percentage}%`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.min(100, Math.max(0, percentage))}
        >
          <div
            className={`h-full rounded-full ${theme.bar}`}
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        </div>
      ) : (
        <p className="mt-4 text-xs text-slate-400">
          Sin métricas disponibles
        </p>
      )}
    </article>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,120px)_minmax(0,1fr)] gap-3 py-2 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="break-words font-medium text-slate-800">
        {value ?? 'No disponible'}
      </dd>
    </div>
  );
}

function Panel({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      <h2 className="mb-4 text-base font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

export default function InstanceDetailPage() {
  const { vmid: vmidParam } = useParams<{ vmid: string }>();
  const navigate = useNavigate();
  const { canAccessInstance } = useAuth();

  const {
    instances,
    isLoading,
    errorMessage,
    reloadInventory,
    pendingPowerActions,
    markPowerActionAccepted,
    revalidateInventory,
    transitioningTasks,
  } = useInstances();

  const [activeTab, setActiveTab] = useState<DetailTab>('resumen');
  const [accessDenied, setAccessDenied] = useState(false);

  const instanceRef = vmidParam?.trim() ?? '';
  const legacyVmid = Number(instanceRef);
  const validVmid = Boolean(instanceRef) && (
    (Number.isSafeInteger(legacyVmid) && legacyVmid > 0) || instanceRef.startsWith('inst_')
  );

  const hasAccess = validVmid && canAccessInstance(Number.isSafeInteger(legacyVmid) && legacyVmid > 0 ? legacyVmid : instanceRef);

  useEffect(() => {
    if (!validVmid) return;

    if (!canAccessInstance(Number.isSafeInteger(legacyVmid) && legacyVmid > 0 ? legacyVmid : instanceRef)) {
      setAccessDenied(true);
      toast.add({
        title: 'Acceso denegado',
        description: 'No tenés permisos para consultar esta instancia.',
        type: 'error',
      });
      navigate('/instances', { replace: true });
    }
  }, [validVmid, instanceRef, legacyVmid, canAccessInstance, navigate]);

  const instance = useMemo(
    () => instances.find((item) => String(item.id) === instanceRef) ?? null,
    [instances, instanceRef],
  );

  const transition = instance ? transitioningTasks[instance.id] : undefined;
  const actionPending = instance
    ? Boolean(pendingPowerActions[instance.id])
    : false;

  if (!validVmid) {
    return (
      <main className="min-h-full bg-slate-50 p-6">
        <DetailError
          title="Identificador inválido"
          description="El identificador de la instancia no es válido."
        />
      </main>
    );
  }

  if (accessDenied || !hasAccess) {
    return (
      <main className="min-h-full bg-slate-50 p-6">
        <p role="status" className="text-sm text-slate-500">
          Volviendo al inventario…
        </p>
      </main>
    );
  }

  if (isLoading && !instance) {
    return (
      <main className="min-h-full bg-slate-50 p-6">
        <p role="status" aria-busy="true" className="text-sm text-slate-500">
          Cargando detalle de la instancia…
        </p>
      </main>
    );
  }

  if (errorMessage && !instance) {
    return (
      <main className="min-h-full bg-slate-50 p-6">
        <DetailError
          title="No se pudo cargar la instancia"
          description={errorMessage}
          onRetry={reloadInventory}
        />
      </main>
    );
  }

  if (!instance) {
    return (
      <main className="min-h-full bg-slate-50 p-6">
        <DetailError
          title="Instancia no encontrada"
          description="No encontramos esa instancia en el inventario actual."
        />
      </main>
    );
  }

  const cpuUsage = instance.cpuUsage ?? null;
  const ramUsage = instance.ramUsage ?? null;

  const tabs: { id: DetailTab; label: string }[] = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'recursos', label: 'Recursos' },
    { id: 'configuracion', label: 'Configuración' },
  ];

  async function copyIp() {
    if (!instance?.ip) return;

    try {
      await navigator.clipboard.writeText(instance.ip);
      toast.add({
        title: 'IP copiada',
        description: instance.ip,
        type: 'success',
      });
    } catch {
      toast.add({
        title: 'No se pudo copiar la IP',
        description: 'Podés seleccionar y copiar la dirección manualmente.',
        type: 'error',
      });
    }
  }

  return (
    <>
      {/* Encabezado */}
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <nav
            aria-label="Migas de pan"
            className="mb-3 flex items-center gap-2 text-sm text-slate-500"
          >
            <Link to="/instances" className="hover:text-blue-700">
              Instancias
            </Link>
            <span aria-hidden="true">›</span>
            <span className="font-medium text-slate-800">{instance.name}</span>
          </nav>
      </div>

      {/* Resumen principal */}
      <section className="flex justify-between gap-5 rounded-xl border border-slate-200 bg-white py-2 px-5 my-2 shadow-sm lg:items-center">
        <div className="flex min-w-0 items-center gap-2">
          <div className={`size-14 rounded-full flex items-center justify-center ${instance.type === 'VM' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {instance.type === 'VM' ? <Monitor className="size-8" /> : <Container className="size-8" />}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-semibold">{instance.name}</h2>
              <InstanceStatusBadge status={instance.status}/>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <InstanceTypeBadge type={instance.type}/>
              <span>ID: {instance.id}</span>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-500">Nodo</p>
          <p className="mt-1 font-medium">{instance.node}</p>
        </div>

        <div>
          <p className="text-xs text-slate-500">Tipo de instancia</p>
          <p className="mt-1 font-medium">
            {instance.type.toUpperCase()}
          </p>
        </div>

        <div className="min-w-0">
          <p className="text-xs text-slate-500">Dirección IP</p>
          {instance.ip ? (
            <button
              type="button"
              onClick={copyIp}
              className="mt-1 max-w-full break-all text-left font-medium text-blue-700 hover:underline"
              title="Copiar dirección IP"
            >
              {instance.ip} <span aria-hidden="true">⧉</span>
            </button>
          ) : (
            <p className="mt-1 text-sm text-slate-400">No disponible</p>
          )}
        </div>
        <div className="min-w-0">
          <InstanceAction
            instance={instance}
            transition={transition}
            isPowerActionPending={actionPending}
            onActionAccepted={(action) =>
              markPowerActionAccepted(instance.id, action)
            }
            onDeleteAccepted={() => {
              revalidateInventory();
              navigate('/instances');
            }}
          />
        </div>
      </section>

      {/* Pestañas */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div
          role="tablist"
          aria-label="Secciones del detalle"
          className="flex gap-1 overflow-x-auto border-b border-slate-200 px-4"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 border-b-2 px-4 py-4 text-sm ${
                activeTab === tab.id
                  ? 'border-blue-600 font-semibold text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-5">
          {activeTab === 'resumen' && (
            <div className="space-y-5">
              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-semibold">Uso de recursos</h2>
                  <span className="text-xs text-slate-400">
                    Datos disponibles del inventario
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <MetricCard
                    title="CPU"
                    value={cpuUsage == null ? '—' : `${cpuUsage}%`}
                    subtitle="Uso informado por el backend"
                    percentage={cpuUsage}
                    color="green"
                  />
                  <MetricCard
                    title="RAM"
                    value={ramUsage == null ? '—' : `${ramUsage}%`}
                    subtitle="Uso informado por el backend"
                    percentage={ramUsage}
                    color="blue"
                  />
                  <MetricCard
                    title="Estado"
                    value={instance.status.toLowerCase() === 'running' ? 'Activa' : '—'}
                    subtitle={instance.status}
                    color="orange"
                  />
                </div>
              </div>
              <Panel title="Información general">
                <dl className="grid gap-x-8 sm:grid-cols-2">
                  <div>
                    <InfoRow label="Nombre" value={instance.name} />
                    <InfoRow label="ID" value={instance.id} />
                    <InfoRow label="Tipo" value={instance.type.toUpperCase()} />
                    <InfoRow label="Estado" value={instance.status} />
                  </div>
                  <div>
                    <InfoRow label="Nodo" value={instance.node} />
                    <InfoRow label="Dirección IP" value={instance.ip} />
                    <InfoRow label="Nivel de acceso" value={instance.nivelAcceso} />
                    <InfoRow
                      label="Tarea activa"
                      value={
                        instance.activeTask?.status === 'RUNNING'
                          ? instance.activeTask.action
                          : 'Ninguna'
                      }
                    />
                  </div>
                </dl>
              </Panel>
            </div>
          )}

          {activeTab === 'recursos' && (
            <div className="space-y-4">
              <div>
                <h2 className="font-semibold">Recursos asignados y utilizados</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Se muestran únicamente los valores que entrega el inventario.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard
                  title="CPU"
                  value={cpuUsage == null ? '—' : `${cpuUsage}%`}
                  subtitle="Uso de CPU"
                  percentage={cpuUsage}
                  color="green"
                />
                <MetricCard
                  title="RAM"
                  value={ramUsage == null ? '—' : `${ramUsage}%`}
                  subtitle="Uso de memoria"
                  percentage={ramUsage}
                  color="blue"
                />
                <MetricCard
                  title="RAM máxima"
                  value={instance.maxRam == null ? '—' : `${instance.maxRam} MB`}
                  subtitle="Capacidad informada"
                  color="orange"
                />
              </div>
            </div>
          )}

          {activeTab === 'configuracion' && (
            <div className="max-w-3xl">
              <h2 className="mb-3 font-semibold">Configuración disponible</h2>
              <dl className="divide-y divide-slate-100">
                <InfoRow label="Nombre" value={instance.name} />
                <InfoRow label="VMID" value={instance.id} />
                <InfoRow label="Tipo" value={instance.type.toUpperCase()} />
                <InfoRow label="Nodo" value={instance.node} />
                <InfoRow label="IP" value={instance.ip} />
                <InfoRow label="Nivel de acceso" value={instance.nivelAcceso} />
              </dl>
              <p className="mt-4 text-xs text-slate-400">
                Las opciones avanzadas se mostrarán cuando estén disponibles
                en el contrato del backend.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function DetailError({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <section className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-lg font-semibold">{title}</h1>
      <p role="alert" className="mt-2 text-sm text-slate-600">
        {description}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            Reintentar
          </button>
        )}
        <Link
          to="/instances"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Volver al inventario
        </Link>
      </div>
    </section>
  );
}
