import { ArrowRight, ChevronDown, CircleHelp, Compass, Mail, Map, Signpost } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function NotFound() {
    return (
        <div className={style.page}>
            <aside className={style.sidebar}><Sidebar /></aside>
            <main className={style.main}>
                <header className={style.header}>
                    <Button type="button" variant="ghost" className={style.helpButton}>
                        <CircleHelp className={style.smallIcon} /> Ayuda
                    </Button>
                    <div className={style.profile}>
                        <span className={style.avatar}>AD</span>
                        <span>Admin</span>
                        <ChevronDown className={style.smallIcon} aria-hidden="true" />
                    </div>
                </header>

                <section className={style.content}>
                    <div className={style.illustration} aria-hidden="true">
                        <Signpost className={style.signpostIcon} strokeWidth={1} />
                        <span className={style.errorCode}>404</span>
                    </div>
                    <h1 className={style.title}>Página no encontrada</h1>
                    <div className={style.description}>
                        <p>No pudimos encontrar la página que estás buscando.</p>
                        <p>Es posible que el enlace esté roto o que la página haya sido movida.</p>
                    </div>
                    <div className={style.actions}>
                        <Button type="button" className={style.primaryButton}>
                            <ArrowRight className={style.smallIcon} /> Volver al dashboard
                        </Button>
                        <Button type="button" variant="outline" className={style.secondaryButton}>
                            <Compass className={style.smallIcon} /> Explorar instancias
                        </Button>
                    </div>

                    <Card className={style.supportCard}>
                        <span className={style.supportIcon}><Map className={style.icon} /></span>
                        <div className={style.supportContent}>
                            <h2 className={style.supportTitle}>¿Necesitás ayuda?</h2>
                            <p className={style.supportDescription}>Si creés que esto es un error, contactá al administrador del sistema.</p>
                        </div>
                        <Button type="button" variant="outline" className={style.supportButton}>
                            <Mail className={style.smallIcon} /> Contactar soporte
                        </Button>
                    </Card>
                </section>
            </main>
        </div>
    );
}

const style = {
    page: 'flex min-h-screen bg-gray-50 font-sans text-slate-900',
    sidebar: 'hidden shrink-0 border-r border-slate-200 bg-white md:block',
    main: 'flex min-w-0 flex-1 flex-col',
    header: 'flex min-h-24 items-center justify-end gap-5 px-5 sm:px-8',
    helpButton: 'gap-2 px-2 text-slate-700',
    smallIcon: 'size-5!',
    icon: 'size-6',
    profile: 'flex items-center gap-3 border-l border-slate-200 pl-5 text-sm font-medium',
    avatar: 'flex size-9 items-center justify-center rounded-full bg-green-700 text-sm font-medium text-white',
    content: 'mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-5 py-12 text-center sm:px-10 lg:py-16',
    illustration: 'mb-8 flex min-h-44 w-full max-w-xl items-end justify-center gap-4 border-b border-slate-300 bg-gradient-to-t from-green-50/60 to-transparent px-4 pt-8 sm:min-h-60 sm:gap-6',
    signpostIcon: 'mb-2 size-20 shrink-0 text-slate-400 sm:size-32',
    errorCode: 'text-[100px] leading-none font-bold tracking-tight text-slate-800 sm:text-[160px]',
    title: 'mb-4 text-[28px] font-semibold tracking-tight text-slate-900 sm:text-[34px]',
    description: 'space-y-1 text-sm leading-relaxed text-slate-500 sm:text-base',
    actions: 'mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6',
    primaryButton: 'h-12 gap-3 bg-green-700! px-6 text-white hover:bg-green-800! hover:border-green-800!',
    secondaryButton: 'h-12 gap-3 px-6',
    supportCard: 'mt-14 flex w-full flex-col items-center gap-4 rounded-xl border border-slate-100 bg-white p-5 text-center shadow-sm ring-0 lg:flex-row lg:text-left',
    supportIcon: 'flex size-14 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700',
    supportContent: 'min-w-0 flex-1',
    supportTitle: 'mb-1 text-base font-medium text-slate-700',
    supportDescription: 'text-sm leading-relaxed text-slate-500',
    supportButton: 'gap-2 px-4',
};
