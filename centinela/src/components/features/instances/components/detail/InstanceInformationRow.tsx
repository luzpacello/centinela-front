import type { ReactNode } from 'react';

export default function InstanceInformationRow({ label, children }: { label: string; children?: ReactNode }) {
    return <div className={styles.informationRow}>
        <dt className={styles.label}>{label}</dt>
        <dd className={styles.value}>{children ?? '—'}</dd>
    </div>;
}

const styles = {
    informationRow: 'grid grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] items-start gap-4 py-1.5 text-sm',
    label: 'text-slate-500',
    value: 'min-w-0 break-words font-medium text-slate-900',
};
