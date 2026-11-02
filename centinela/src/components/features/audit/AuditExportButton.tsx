import { useState } from 'react';
import { Braces, ChevronDown, Download, FileSpreadsheet, LoaderCircle } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropDownMenu';
import { toast } from '@/components/ui/toast';
import { exportAuditLogs, type AuditFilterParams, type AuditExportFormat } from './services/auditService';

interface AuditExportButtonProps {
    filters: AuditFilterParams;
}

function triggerDownload(blob: Blob, filename: string): void {
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 0);
}

export function AuditExportButton({ filters }: AuditExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);

    async function handleExport(format: AuditExportFormat) {
        setIsExporting(true);
        try {
            const { blob, filename } = await exportAuditLogs(filters, format);
            triggerDownload(blob, filename);
            toast.add({
                title: 'Exportación completada',
                description: 'Reporte de auditoría descargado exitosamente.',
                type: 'success',
            });
        } catch {
            toast.add({
                title: 'Error al exportar',
                description: 'No se pudo generar la exportación de auditoría. Intente nuevamente.',
                type: 'error',
            });
        } finally {
            setIsExporting(false);
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                type="button"
                aria-haspopup="menu"
                aria-label="Exportar registros"
                disabled={isExporting}
            >
                {isExporting
                    ? <LoaderCircle className="size-4! animate-spin" aria-hidden="true" />
                    : <Download className="size-4!" aria-hidden="true" />}
                {isExporting ? 'Exportando…' : 'Exportar registros'}
                {!isExporting && <ChevronDown className="size-4!" aria-hidden="true" />}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-60">
                <DropdownMenuItem
                    aria-label="Exportar auditoría en formato CSV"
                    disabled={isExporting}
                    onClick={() => void handleExport('csv')}
                >
                    <FileSpreadsheet aria-hidden="true" />
                    Exportar como CSV (.csv)
                </DropdownMenuItem>
                <DropdownMenuItem
                    aria-label="Exportar auditoría en formato JSON"
                    disabled={isExporting}
                    onClick={() => void handleExport('json')}
                >
                    <Braces aria-hidden="true" />
                    Exportar como JSON (.json)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
