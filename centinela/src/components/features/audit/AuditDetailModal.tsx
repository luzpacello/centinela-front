import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auditDetallesSeguros, type AuditDetalles } from '@/utils/auditDetalle';

interface AuditDetailModalProps {
    action: string;
    details: AuditDetalles;
    onClose: () => void;
}

export function AuditDetailModal({ action, details, onClose }: AuditDetailModalProps) {
    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') onClose();
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="audit-detail-title"
                className="w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl"
            >
                <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
                    <div className="min-w-0">
                        <h2 id="audit-detail-title" className="text-lg font-semibold text-slate-900">
                            Detalle de auditoría
                        </h2>
                        <p className="truncate text-sm text-slate-600">{action}</p>
                    </div>
                    <Button type="button" variant="ghost" size="icon" aria-label="Cerrar detalle" onClick={onClose}>
                        <X aria-hidden="true" />
                    </Button>
                </header>
                <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap break-words p-5 font-mono text-sm text-slate-800">
                    {auditDetallesSeguros(details)}
                </pre>
            </section>
        </div>
    );
}
