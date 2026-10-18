import { Info, Network } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
    Combobox,
    ComboboxContent,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import NetworkModeOption from '@/components/features/instances/components/NetworkModeOption';
import {
    DEFAULT_NETWORK_CONFIGURATION,
    NETWORK_BRIDGE_OPTIONS,
} from '@/components/features/instances/data/createInstanceOptions';
import type {
    CreateInstanceDraft,
    InstanceNetworkMode,
    UpdateInstanceNetworkField,
} from '@/components/features/instances/types/createInstance';

interface ConfigureInstanceNetworkProps {
    draft: CreateInstanceDraft;
    onNetworkFieldChange: UpdateInstanceNetworkField;
}

export default function ConfigureInstanceNetwork({
    draft,
    onNetworkFieldChange,
}: ConfigureInstanceNetworkProps) {
    const selectedNetworkMode = draft.red.modo ?? DEFAULT_NETWORK_CONFIGURATION.modo;
    const isStaticIpMode = selectedNetworkMode === 'static';

    function selectNetworkMode(networkMode: InstanceNetworkMode) {
        onNetworkFieldChange('modo', networkMode);
    }

    return (
        <Card className={styles.networkConfigurationCard}>
            <div>
                <h3 id="network-bridge-title">Brige</h3>
                <p>Selecciona el puente de red al que se conectará la instancia.</p>
            </div>

            <Combobox
                value={draft.red.bridge || null}
                onValueChange={(bridge) => onNetworkFieldChange('bridge', bridge ?? '')}
            >
                <ComboboxInput aria-label="Puente de red" placeholder="Seleccionar puente de red" />
                <ComboboxContent>
                    <ComboboxList>
                        {NETWORK_BRIDGE_OPTIONS.map((bridgeOption) => (
                            <ComboboxItem key={bridgeOption.value} value={bridgeOption.value}>
                                <Network aria-hidden="true" />
                                {bridgeOption.label}
                            </ComboboxItem>
                        ))}
                    </ComboboxList>
                </ComboboxContent>
            </Combobox>

            <div className={styles.networkAvailabilityNotice}>
                <Info aria-hidden="true" />
                <span className="text-info">
                    El puente seleccionado estará disponible en el nodo {draft.nodo || 'seleccionado'}.
                </span>
            </div>

            <section className={styles.ipv4ConfigurationSection} aria-labelledby="ipv4-configuration-title">
                <div>
                    <h3 id="ipv4-configuration-title">Configuración IPv4</h3>
                    <p>Selecciona cómo se asignará la dirección IP.</p>
                </div>

                <div className={styles.networkModeGrid} role="radiogroup" aria-label="Modo de asignación IPv4">
                    <NetworkModeOption
                        title="DHCP"
                        description="La IP será asignada automáticamente por el servidor DHCP de la red."
                        isSelected={selectedNetworkMode === 'dhcp'}
                        onSelect={() => selectNetworkMode('dhcp')}
                    />
                    <NetworkModeOption
                        title="IP estática"
                        description="Configura manualmente la dirección IP, prefijo de red y puerta de enlace."
                        isSelected={selectedNetworkMode === 'static'}
                        onSelect={() => selectNetworkMode('static')}
                    />
                </div>

                <div className={styles.staticNetworkFieldsGrid}>
                    <div className={styles.fieldContainer}>
                        <label className={styles.fieldLabel} htmlFor="network-ip-address">Dirección IP</label>
                        <Input
                            id="network-ip-address"
                            value={draft.red.ip}
                            placeholder="Ej: 192.168.1.50"
                            disabled={!isStaticIpMode}
                            onChange={(event) => onNetworkFieldChange('ip', event.target.value)}
                        />
                    </div>

                    <div className={styles.fieldContainer}>
                        <label className={styles.fieldLabel} htmlFor="network-prefix">Prefijo de red (CIDR)</label>
                        <Input
                            id="network-prefix"
                            value={draft.red.mascara}
                            placeholder="Ej: 24"
                            disabled={!isStaticIpMode}
                            onChange={(event) => onNetworkFieldChange('mascara', event.target.value)}
                        />
                        <p className="text-secundario mt-2">Ej: 24 (255.255.255.0)</p>
                    </div>

                    <div className={styles.fieldContainer}>
                        <label className={styles.fieldLabel} htmlFor="network-gateway">Puerta de enlace (Gateway)</label>
                        <Input
                            id="network-gateway"
                            value={draft.red.gateway}
                            placeholder="Ej: 192.168.1.1"
                            disabled={!isStaticIpMode}
                            onChange={(event) => onNetworkFieldChange('gateway', event.target.value)}
                        />
                        <p className="text-secundario mt-2">Dirección IP del router de la red.</p>
                    </div>
                </div>
            </section>
        </Card>
    );
}

const styles = {
    networkConfigurationCard: 'gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-none ring-0',
    networkAvailabilityNotice: 'flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 text-xs text-blue-700',
    ipv4ConfigurationSection: 'grid gap-4 border-t border-slate-200 pt-5',
    networkModeGrid: 'grid grid-cols-1 gap-4 md:grid-cols-2',
    staticNetworkFieldsGrid: 'grid grid-cols-1 gap-x-5 gap-y-4 md:grid-cols-3 mt-2',
    fieldContainer: 'min-w-0',
    fieldLabel: 'mb-2 block',
};
