import type { ComponentType } from 'react';
import { CheckCircle2 } from 'lucide-react';

interface RoleOptionCardProps {
    name: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
    isSelected: boolean;
}

export function RoleOptionCard({ name, description, icon: Icon, isSelected }: RoleOptionCardProps) {
    return (
        <div className={`flex gap-3 rounded-lg border p-3 ${isSelected ? 'border-blue-200 bg-blue-50/60' : 'border-transparent'}`}>
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                <Icon className="size-4" />
            </span>
            <div className="min-w-0">
                <p className="text-xs font-semibold">{name}</p>
                <p className="mt-1 text-caption">{description}</p>
            </div>
            {isSelected && <CheckCircle2 className="ml-auto size-4 shrink-0 text-blue-600" />}
        </div>
    );
}
