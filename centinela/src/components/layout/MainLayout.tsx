import React from 'react';
import Sidebar from './Sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import type { UserSession } from '@/components/features/auth/types/authentication';

export default function MainLayout({ children, user }: { children?: React.ReactNode; user?: UserSession }) {
    return (
        <SidebarProvider defaultOpen>
            <div className="flex h-screen min-w-0 flex-1 bg-gray-50 font-sans">
                <Sidebar user={user} />

                <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
                    <SidebarTrigger className="absolute top-3 left-3 z-10" />

                    <div className="flex-1 overflow-auto p-8">
                        {children ? (
                            children
                        ) : (
                            <div className="border-2 border-dashed border-gray-300 rounded-xl h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                                <p>Área de trabajo</p>
                                <p className="text-sm">Acá adentro van a aparecer los componentes de las pages.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}