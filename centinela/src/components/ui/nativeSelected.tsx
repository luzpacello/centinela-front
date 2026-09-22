import type { ComponentProps } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

function NativeSelect({ className, children, ...props }: ComponentProps<'select'>) {
    return (
        <div data-slot="native-select-wrapper" className={cn('relative', className)}>
            <select
                data-slot="native-select"
                className="h-10 w-full min-w-0 appearance-none rounded-lg border border-slate-300 bg-white py-1 pl-2.5 pr-9 text-sm text-slate-900 outline-none transition-colors hover:border-slate-400 focus:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 aria-invalid:border-red-500"
                {...props}
            >
                {children}
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
        </div>
    );
}

function NativeSelectOption(props: ComponentProps<'option'>) {
    return <option data-slot="native-select-option" {...props} />;
}

export { NativeSelect, NativeSelectOption };
