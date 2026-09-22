import React from 'react';
import Sidebar from './Sidebar';
// import Header from './Header';
import type { UserSession } from '@/components/features/auth/types/authentication';

export default function MainLayout({ children, user }: { children?: React.ReactNode; user?: UserSession }) {
    return (
        <div className="flex h-screen bg-gray-50 font-sans">

            {/* Importamos la barra lateral */}
            <Sidebar user={user} />

            {/* Contenedor derecho (Header + Contenido) */}
            <main className="flex-1 flex flex-col overflow-hidden">

                {/* Importamos el Header */}
                {/* <Header /> */}

                {/* Área donde van a inyectarse las pantallas con React Router (Outlet) */}
                <div className="flex-1 p-8 overflow-auto">
                    {children ? (
                        children
                    ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-xl h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                            <p >Área de trabajo</p>
                            <p className="text-sm">Acá adentro van a aparecer los componentes de las pages.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}