import { useState } from 'react';
import { Package, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
// Íconos de distribuciones de Simple Icons (CC0).
import debianIcon from '@/components/features/instances/assets/distributions/debian.svg';
import ubuntuIcon from '@/components/features/instances/assets/distributions/ubuntu.svg';
import alpineIcon from '@/components/features/instances/assets/distributions/alpinelinux.svg';
import { parseTemplateOption, type ParsedTemplate } from '@/components/features/instances/data/createInstanceOptions';
import type {
    CreateInstanceDraft,
    OperatingSystemTemplateOption,
} from '@/components/features/instances/types/createInstance';

const TEMPLATE_FAMILIES: { family: ParsedTemplate['family']; label: string; icon?: string }[] = [
    { family: 'debian', label: 'Debian', icon: debianIcon },
    { family: 'ubuntu', label: 'Ubuntu', icon: ubuntuIcon },
    { family: 'alpine', label: 'Alpine', icon: alpineIcon },
    { family: 'other', label: 'Otro' },
];

interface SelectInstanceOperatingSystemProps {
    draft: CreateInstanceDraft;
    templates: OperatingSystemTemplateOption[];
    isLoadingCatalog: boolean;
    catalogError: string | null;
    onTemplateChange: (templateValue: string) => void;
}

export default function SelectInstanceOperatingSystem({
    draft,
    templates,
    isLoadingCatalog,
    catalogError,
    onTemplateChange,
}: SelectInstanceOperatingSystemProps) {
    const [templateSearch, setTemplateSearch] = useState('');
    const availableTemplates = draft.tipo
        ? templates.filter((template) => template.type === (draft.tipo === 'vm' ? 'ISO' : 'LXC_TEMPLATE'))
        : [];
    const normalizedSearch = templateSearch.trim().toLowerCase();
    const filteredTemplates = availableTemplates.map((template) => ({
        template,
        parsed: parseTemplateOption(template.value),
    })).filter(({ template, parsed }) => (
        `${template.templateName} ${template.value} ${template.distribution} ${template.operatingSystem} ${template.version} ${parsed.displayName}`
            .toLowerCase()
            .includes(normalizedSearch)
    ));
    const groups = TEMPLATE_FAMILIES.map((family) => ({
        ...family,
        templates: filteredTemplates.filter(({ parsed }) => parsed.family === family.family),
    })).filter((family) => family.templates.length > 0);

    return (
        <Card className={styles.templateSelectionCard}>
            <div className={styles.tableToolbar}>
                <div>
                    <h3>Selecciona un template</h3>
                    <p className="text-secundario">
                        Elige el template base para crear la instancia.
                    </p>
                </div>

                <div className={styles.searchContainer}>
                    <Search className={styles.searchIcon} aria-hidden="true" />
                    <Input
                        value={templateSearch}
                        className={styles.searchInput}
                        placeholder="Buscar template..."
                        aria-label="Buscar template"
                        onChange={(event) => setTemplateSearch(event.target.value)}
                    />
                </div>
            </div>

            <div role="radiogroup" aria-label="Template del sistema operativo" className={styles.templateGroups}>
                {groups.map((group) => (
                    <section key={group.family} aria-labelledby={`template-family-${group.family}`}>
                        <h4 id={`template-family-${group.family}`} className={styles.familyTitle}>{group.label}</h4>
                        <div className={styles.templateGrid}>
                            {group.templates.map(({ template, parsed }) => (
                                <OperatingSystemTemplateCard
                                    key={template.value}
                                    template={template}
                                    parsed={parsed}
                                    icon={group.icon}
                                    isSelected={draft.templateOso === template.value}
                                    onSelect={() => onTemplateChange(template.value)}
                                />
                            ))}
                        </div>
                    </section>
                ))}
                {filteredTemplates.length === 0 && (
                    <p className={styles.emptyState}>
                        {catalogError || (isLoadingCatalog
                            ? 'Cargando imágenes…'
                            : draft.tipo
                                ? 'No se encontraron templates para la búsqueda.'
                                : 'Selecciona primero el tipo de instancia.')}
                    </p>
                )}
            </div>
        </Card>
    );
}

interface OperatingSystemTemplateCardProps {
    template: OperatingSystemTemplateOption;
    parsed: ParsedTemplate;
    icon?: string;
    isSelected: boolean;
    onSelect: () => void;
}

function OperatingSystemTemplateCard({
    template,
    parsed,
    icon,
    isSelected,
    onSelect,
}: OperatingSystemTemplateCardProps) {
    return (
        <label className={`${styles.templateCard} ${isSelected ? styles.selectedTemplateCard : ''}`}>
            <input
                type="radio"
                name="instance-template"
                value={template.value}
                checked={isSelected}
                aria-label={`Seleccionar ${parsed.displayName}, ${template.templateName}`}
                onChange={onSelect}
                className="sr-only"
            />
            <span className={styles.templateCardHeader}>
                <span className={styles.templateIconContainer}>
                    {icon ? <img src={icon} className={styles.templateIcon} alt="" /> : <Package className={styles.templateIcon} aria-hidden="true" />}
                </span>
                <Badge variant="secondary">{parsed.displayName}</Badge>
            </span>
            <strong className={styles.templateName}>{template.templateName}</strong>
            <span className="text-secundario">{template.size}</span>
        </label>
    );
}

const styles = {
    templateSelectionCard: 'gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-none ring-0',
    tableToolbar: 'flex flex-col gap-4 md:flex-row md:items-end md:justify-between',
    searchContainer: 'relative w-full md:max-w-64',
    searchIcon: 'pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-slate-400',
    searchInput: 'pl-10',
    templateGroups: 'grid gap-5',
    familyTitle: 'mb-2 text-sm font-semibold text-slate-900',
    templateGrid: 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3',
    templateCard: 'flex min-w-0 cursor-pointer flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 text-left transition-colors hover:border-blue-300 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue-600',
    selectedTemplateCard: 'border-blue-600 bg-blue-50/70',
    templateCardHeader: 'flex items-center justify-between gap-2',
    templateIconContainer: 'flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600',
    templateIcon: 'size-4',
    templateName: 'break-all text-sm font-semibold text-slate-900',
    emptyState: 'py-8 text-center text-sm text-slate-500',
};
