import { useState } from 'react';
import { Disc3, Package, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type {
    CreateInstanceDraft,
    OperatingSystemTemplateOption,
} from '@/components/features/instances/types/createInstance';

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
    const filteredTemplates = availableTemplates.filter((template) => (
        `${template.templateName} ${template.distribution} ${template.operatingSystem} ${template.version}`
            .toLowerCase()
            .includes(normalizedSearch)
    ));

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

            <div className={styles.tableContainer}>
                <Table className={styles.templatesTable}>
                    <TableHeader>
                        <TableRow className={styles.tableHeaderRow}>
                            <TableHead className={styles.selectionColumn}>
                                <span className="sr-only">Seleccionar</span>
                            </TableHead>
                            <TableHead className="header-of-table">Template</TableHead>
                            <TableHead className="header-of-table">Sistema operativo</TableHead>
                            <TableHead className="header-of-table">Versión</TableHead>
                            <TableHead className="header-of-table">Tamaño</TableHead>
                            <TableHead className="header-of-table">Fecha</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody role="radiogroup" aria-label="Template del sistema operativo">
                        {filteredTemplates.map((template) => (
                            <OperatingSystemTemplateRow
                                key={template.value}
                                template={template}
                                instanceType={draft.tipo}
                                isSelected={draft.templateOso === template.value}
                                onSelect={() => onTemplateChange(template.value)}
                            />
                        ))}
                        {filteredTemplates.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className={styles.emptyStateCell}>
                                    {catalogError || (isLoadingCatalog
                                        ? 'Cargando imágenes…'
                                        : draft.tipo
                                            ? 'No se encontraron templates para la búsqueda.'
                                            : 'Selecciona primero el tipo de instancia.')}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
}

interface OperatingSystemTemplateRowProps {
    template: OperatingSystemTemplateOption;
    instanceType: CreateInstanceDraft['tipo'];
    isSelected: boolean;
    onSelect: () => void;
}

function OperatingSystemTemplateRow({
    template,
    instanceType,
    isSelected,
    onSelect,
}: OperatingSystemTemplateRowProps) {
    const TemplateIcon = instanceType === 'vm' ? Disc3 : Package;

    return (
        <TableRow
            data-state={isSelected ? 'selected' : undefined}
            className={`${styles.tableBodyRow} ${isSelected ? styles.selectedTableBodyRow : ''}`}
        >
            <TableCell className={styles.selectionCell}>
                <button
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`Seleccionar ${template.templateName}`}
                    className={`${styles.selectionControl} ${isSelected ? styles.selectedSelectionControl : styles.unselectedSelectionControl}`}
                    onClick={(event) => {
                        event.stopPropagation();
                        onSelect();
                    }}
                >
                    {isSelected && <span className={styles.selectionControlDot} />}
                </button>
            </TableCell>
            <TableCell className={styles.templateCell}>
                <span className={styles.templateIconContainer}>
                    <TemplateIcon className={styles.templateIcon} aria-hidden="true" />
                </span>
                <span className={styles.templateNameContainer}>
                    <strong className={styles.templateName}>{template.templateName}</strong>
                    <span className="text-secundario">{template.distribution}</span>
                </span>
            </TableCell>
            <TableCell className="text-of-table">{template.operatingSystem}</TableCell>
            <TableCell className="text-of-table">{template.version}</TableCell>
            <TableCell className="text-of-table">{template.size}</TableCell>
            <TableCell className="text-of-table">{template.date}</TableCell>
        </TableRow>
    );
}

const styles = {
    templateSelectionCard: 'gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-none ring-0',
    tableToolbar: 'flex flex-col gap-4 md:flex-row md:items-end md:justify-between',
    searchContainer: 'relative w-full md:max-w-64',
    searchIcon: 'pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-slate-400',
    searchInput: 'pl-10',
    tableContainer: 'overflow-hidden rounded-lg border border-slate-200',
    templatesTable: 'min-w-[48rem] text-xs text-slate-700',
    tableHeaderRow: 'bg-slate-50/80 hover:bg-slate-50/80',
    selectionColumn: 'w-14 pl-5',
    tableBodyRow: 'hover:bg-slate-50/70',
    selectedTableBodyRow: 'bg-blue-50/70 hover:bg-blue-50/70',
    selectionCell: 'pl-5',
    selectionControl: 'flex size-5 items-center justify-center rounded-full border-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
    selectedSelectionControl: 'border-blue-600 bg-blue-600',
    unselectedSelectionControl: 'border-slate-300 bg-white hover:border-blue-400',
    selectionControlDot: 'size-2 rounded-full bg-white',
    templateCell: 'flex items-center gap-3',
    templateIconContainer: 'flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600',
    templateIcon: 'size-4',
    templateNameContainer: 'flex min-w-0 flex-col',
    templateName: 'text-of-table font-semibold',
    emptyStateCell: 'h-24 text-center text-slate-500',
};
