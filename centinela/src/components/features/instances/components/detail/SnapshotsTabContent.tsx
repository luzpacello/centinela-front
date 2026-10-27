import { Camera, Clock3 } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function SnapshotsTabContent() {
    return (
        <Card className="gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm ring-0">
            <div>
                <h2 className="text-lg font-semibold text-slate-900">Snapshots</h2>
                <p className="mt-1 text-sm text-slate-500">Puntos de restauración de la instancia.</p>
            </div>
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-5 text-center">
                <Camera className="size-8 text-slate-400" aria-hidden="true" />
                <p className="font-medium text-slate-700">Todavía no hay snapshots para mostrar.</p>
                <p className="text-sm text-slate-500">Cuando estén disponibles, vas a poder consultar aquí los puntos de restauración.</p>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock3 className="size-3.5" aria-hidden="true" />
                    La gestión de snapshots estará disponible próximamente.
                </span>
            </div>
        </Card>
    );
}
