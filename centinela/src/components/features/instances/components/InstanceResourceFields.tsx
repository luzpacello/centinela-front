import { useId } from 'react';
import { Cpu, Info, MemoryStick, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldError } from '@/components/ui/field';
import type { InstanceConfigEditor } from '../hooks/useEditInstanceConfig';
import type { InstanceResourceConfiguration } from '../types/instanceDetail';
import type { InstanceResourceValues } from '../validation/editInstanceConfigValidation';

interface InstanceResourceFieldsProps {
    values: InstanceResourceValues;
    current: InstanceResourceValues;
    editor: InstanceConfigEditor;
    status: string;
    disabled: boolean;
    onChange: (field: keyof InstanceResourceConfiguration, value: number) => void;
}

export default function InstanceResourceFields({ values, current, editor, status, disabled, onChange }: InstanceResourceFieldsProps) {
    const fieldId = useId();
    const { assessment, nodeError } = editor;
    const maxRam = Math.max(16, values.ramMb || 0, (current.ramMb || 0) * 2, (current.ramMb || 0) + (assessment.freeRamMb ?? 0) * 2);
    const numericValue = (value: number | null) => value !== null && Number.isFinite(value) ? value : '';
    return <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid content-start gap-2 rounded-lg border border-slate-200 p-4">
                <label htmlFor={`${fieldId}-cpu`} className="flex items-center gap-2 text-sm font-semibold"><Cpu className="size-4" />Núcleos (vCPU)</label>
                <div className="flex items-center gap-2">
                    <Button type="button" size="icon" variant="outline" aria-label="Disminuir CPU" disabled={disabled || values.cores! <= 1}
                        onClick={() => onChange('cores', Math.max(1, (values.cores || 1) - 1))}><Minus className="size-4" /></Button>
                    <Input id={`${fieldId}-cpu`} type="number" min={1} max={assessment.maxCpuCores ?? undefined} step={1}
                        disabled={disabled} value={numericValue(values.cores)} aria-invalid={Boolean(assessment.cpuError)} aria-describedby={`${fieldId}-cpu-help`}
                        onChange={(event) => onChange('cores', event.target.value === '' ? NaN : Number(event.target.value))} />
                    <Button type="button" size="icon" variant="outline" aria-label="Aumentar CPU" disabled={disabled || assessment.maxCpuCores === null || values.cores! >= assessment.maxCpuCores}
                        onClick={() => onChange('cores', Math.min(assessment.maxCpuCores!, (values.cores || 0) + 1))}><Plus className="size-4" /></Button>
                </div>
                <p id={`${fieldId}-cpu-help`} className="text-xs text-slate-500">Máximo del host: {assessment.maxCpuCores ?? '—'} núcleos.</p>
                {assessment.cpuError && <FieldError role="alert">{assessment.cpuError}</FieldError>}
            </div>
            <div className="grid content-start gap-2 rounded-lg border border-slate-200 p-4">
                <label htmlFor={`${fieldId}-ram`} className="flex items-center gap-2 text-sm font-semibold"><MemoryStick className="size-4" />Memoria RAM (MB)</label>
                <Input id={`${fieldId}-ram`} type="number" min={16} step={1} disabled={disabled}
                    value={numericValue(values.ramMb)} aria-invalid={Boolean(assessment.ramError || assessment.exceedsRamQuota)} aria-describedby={`${fieldId}-ram-impact`}
                    onChange={(event) => onChange('ramMb', event.target.value === '' ? NaN : Number(event.target.value))} />
                <input type="range" aria-label="Ajustar memoria RAM" min={16} max={maxRam} step={1} disabled={disabled}
                    value={Number.isFinite(values.ramMb) ? Math.max(16, values.ramMb!) : 16}
                    onChange={(event) => onChange('ramMb', Number(event.target.value))} className="w-full accent-blue-600" />
                <p className="text-xs text-slate-500">Memoria libre segura del host: {assessment.freeRamMb ?? '—'} MB.</p>
                {assessment.ramError && <FieldError role="alert">{assessment.ramError}</FieldError>}
            </div>
        </div>
        <div id={`${fieldId}-ram-impact`} aria-live="polite" className={editor.isLoadingCapacity ? 'rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700' : assessment.quotaError || nodeError ? 'rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700' : 'rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800'}>
            {editor.isLoadingCapacity ? 'Consultando la capacidad disponible del host…' : nodeError || assessment.quotaError || (assessment.deltaRam === null ? 'Verificando configuración…'
                : assessment.deltaRam > 0 ? `Incremento solicitado: +${assessment.deltaRam} MB. Quedarán ${assessment.freeRamMb! - assessment.deltaRam} MB libres en el host.`
                    : assessment.deltaRam < 0 ? `Reducción de memoria: ${assessment.deltaRam} MB respecto a la asignación actual.` : 'Sin cambios en la memoria asignada (DeltaRAM: 0 MB).')}
            {!editor.isLoadingCapacity && (nodeError || assessment.quotaError) && <Button type="button" variant="outline" disabled={disabled} onClick={editor.refreshCapacity} className="mt-2">Actualizar capacidad</Button>}
        </div>
        <div role="note" className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>{status === 'running'
                ? 'Si la instancia está encendida y no cuenta con módulos hot-plug activos, la nueva configuración se aplicará tras el próximo reinicio del sistema huésped.'
                : status === 'stopped' ? 'Los cambios se aplicarán en el próximo encendido.' : 'La aplicación de los cambios depende del estado de la instancia; revisá el estado antes de guardar.'}</p>
        </div>
    </div>;
}
