import React from 'react';
import { Activity, Monitor, ShieldCheck } from 'lucide-react';
import logoCentinela from '@/assets/logo.png';
import AuthIllustration from './AuthIllustration';
import { TypewriterText } from './TypewriterText';

// La app usa JetBrains Mono por defecto; el diseño de auth pide una sans geométrica.
const INTER = "font-[family-name:'Inter',ui-sans-serif,system-ui,sans-serif]";
const HEADLINE = 'Gestioná tus entornos virtuales de forma simple';

const features = [
    {
        icon: Monitor,
        title: 'Control centralizado',
        description: 'Administrá todas tus instancias desde un solo lugar.',
    },
    {
        icon: Activity,
        title: 'Monitoreo en tiempo real',
        description: 'Visualizá el uso de recursos y el estado de tus instancias al instante.',
    },
    {
        icon: ShieldCheck,
        title: 'Seguro y confiable',
        description: 'Conexión segura con tu servidor Proxmox y protección con doble factor (2FA).',
    },
];

const asideStyle: React.CSSProperties = {
    backgroundColor: '#f6f8fb',
    backgroundImage:
        'radial-gradient(circle at 0% 100%, rgba(37, 99, 235, 0.14), rgba(37, 99, 235, 0) 55%), radial-gradient(rgba(148, 163, 184, 0.4) 1px, transparent 1px)',
    backgroundSize: 'auto, 18px 18px',
};

// Continuación del fondo de puntitos sobre el panel del login, difuminándose hacia la derecha.
const mainDotsStyle: React.CSSProperties = {
    backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.4) 1px, transparent 1px)',
    backgroundSize: '18px 18px',
    WebkitMaskImage: 'linear-gradient(to right, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 35%)',
    maskImage: 'linear-gradient(to right, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 35%)',
};

export default function MainLayoutAuth({ children }: { children?: React.ReactNode }) {
    return (
        <div className={`flex h-screen bg-[#f5f6f9] ${INTER}`}>
            {/* La columna lateral solo se muestra en escritorio para no restar
                espacio al formulario en móvil. */}
            <aside
                className="hidden w-full shrink-0 flex-col justify-between overflow-hidden lg:flex lg:w-[37%] lg:min-w-[440px] lg:max-w-[565px]"
                style={asideStyle}
            >
                <div className="flex flex-1 flex-col px-10 pt-9 xl:px-14 xl:pt-10">
                    {/* Marca */}
                    <div className="flex items-center gap-3">
                        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-sm">
                            <img src={logoCentinela} alt="Centinela" className="h-full w-full object-cover" />
                        </div>
                        <p className="text-4xl font-bold text-[#0f172a]">Centinela</p>
                    </div>

                    <TypewriterText
                        text={HEADLINE}
                        className="mt-5 mb-0 font-['JetBrains_Mono',monospace] text-[26px] leading-[1.2] font-bold text-[#0f172a]"
                    />
                    <p className="mt-3 text-[15px] leading-relaxed text-[#64748b]">
                        Centinela te permite administrar, monitorear y operar tus máquinas virtuales y contenedores Proxmox VE
                        en tiempo real desde una interfaz moderna, segura y fácil de usar.
                    </p>

                    {/* Beneficios */}
                    <div className="mt-6 flex flex-col gap-5">
                        {features.map(({ icon: Icon, title, description }) => (
                            <div key={title} className="flex items-start gap-4">
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#eff6ff] text-[#2563eb]">
                                    <Icon className="size-6" aria-hidden="true" strokeWidth={1.9} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[15px] leading-snug font-semibold text-[#0f172a]">{title}</p>
                                    <p className="mt-1 text-[14px] leading-relaxed text-[#64748b]">{description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ilustración adaptativa por altura: recortada contra el borde inferior. Crece por
                    tramos para ocupar el alto disponible y se oculta en viewports bajos. */}
                <div className="mt-4 w-[92%] max-w-[540px] shrink-0 translate-y-3 self-center overflow-hidden [@media(max-height:820px)]:hidden [@media(min-height:821px)_and_(max-height:900px)]:h-[200px] [@media(min-height:901px)_and_(max-height:980px)]:h-[280px] [@media(min-height:981px)_and_(max-height:1019px)]:h-[380px] [@media(min-height:1020px)_and_(max-height:1059px)]:h-[420px] [@media(min-height:1060px)]:h-[460px]">
                    <AuthIllustration />
                </div>
            </aside>

            <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
                {/* Los puntitos del aside se continúan sobre el panel del login y se difuminan hacia la derecha. */}
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block" style={mainDotsStyle} />
                <div className="relative flex flex-1 flex-col overflow-auto p-4">
                    {children ? (
                        children
                    ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-xl h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                            <p >Área de trabajo</p>
                            <p className="text-sm">Acá adentro van a aparecer los componentes de las pages. prueba</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
