import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { InstanceResourceConfiguration } from '../../types/instanceDetail';

interface InstanceResourcesPanelProps {
    configuration: { cores: number | null; ramMb: number | null };
    onChange: (field: keyof InstanceResourceConfiguration, value: number) => void;
    disabled: boolean;
}

export default function InstanceResourcesPanel({ configuration, onChange, disabled }: InstanceResourcesPanelProps) {
    return <Card className={styles.resourcesCard}>
        <div><h2>Recursos de la instancia</h2><p className="text-secundario">Configura CPU y memoria RAM. Aplicá la configuración con Guardar cambios.</p></div>
        <div className={styles.fieldsGrid}>
            <div>
                <label htmlFor="detail-cpu-cores" className={styles.fieldLabel}>Núcleos (vCPU)</label>
                <Input id="detail-cpu-cores" type="number" min={1} step={1} value={Number.isFinite(configuration.cores) ? configuration.cores! : ''} disabled={disabled}
                    aria-invalid={configuration.cores !== null && (!Number.isInteger(configuration.cores) || configuration.cores < 1)}
                    onChange={(event) => onChange('cores', event.target.valueAsNumber)} />
            </div>
            <div>
                <label htmlFor="detail-memory" className={styles.fieldLabel}>Memoria RAM (MiB)</label>
                <Input id="detail-memory" type="number" min={16} step={1} value={Number.isFinite(configuration.ramMb) ? configuration.ramMb! : ''} disabled={disabled}
                    aria-invalid={configuration.ramMb !== null && (!Number.isInteger(configuration.ramMb) || configuration.ramMb < 16)}
                    onChange={(event) => onChange('ramMb', event.target.valueAsNumber)} />
            </div>
        </div>
    </Card>;
}

const styles = {
    resourcesCard: 'gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm ring-0',
    fieldsGrid: 'grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2',
    fieldLabel: 'mb-2 block text-sm font-medium text-slate-900',
};
