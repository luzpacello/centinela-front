import React from 'react';
import { Server, ShieldCheck } from 'lucide-react';

export default function MainLayoutAuth({ children }: { children?: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            {/* La columna lateral solo se muestra en escritorio para no restar
                espacio al formulario en móvil. */}
            <aside className="hidden w-120 shrink-0 bg-white border-r border-gray-200 lg:flex flex-col justify-between h-full">
                <div className="h-25 flex gap-2 px-4 pt-6 justify-center">
                    <span className="text-green-600 text-3xl">logo</span>
                    <h1 className="text-4xl font-bold text-gray-900"> Centinela </h1>
                </div>
                <div className="flex flex-1 flex-col justify-center gap-8 overflow-y-auto px-8 py-6">
                    {/* Bloque 1 — Propósito de la plataforma */}
                    <section className="flex flex-col gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
                            <Server className="h-6 w-6" aria-hidden="true" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            Tu infraestructura virtual, simplificada y bajo control
                        </h2>
                        <p className="text-sm leading-relaxed text-gray-600">
                            Centinela te permite administrar, monitorear y operar tus máquinas virtuales y contenedores Proxmox VE en tiempo real desde un entorno ágil, intuitivo y seguro.
                        </p>
                    </section>
                    {/* Bloque 2 — Requisito de seguridad (2FA) */}
                    <section className="flex flex-col gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
                            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            Protección de infraestructura con doble factor
                        </h2>
                        <p className="text-sm leading-relaxed text-gray-600">
                            Gestionar servidores requiere la máxima seguridad. El 2FA añade una capa de protección indispensable para salvaguardar tus servicios críticos ante cualquier acceso no autorizado.
                        </p>
                    </section>
                </div>
            </aside>
            <main className="min-w-0 flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 p-4 overflow-auto">
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
