import React from 'react';

export default function MainLayoutAuth({ children }: { children?: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            <aside className="w-120 bg-white border-r border-gray-200 flex flex-col justify-between h-full">
                <div className="h-25 flex gap-2 px-4 pt-6 justify-center">
                    <span className="text-green-600 text-3xl">logo</span>
                    <h1 className="text-4xl font-bold text-gray-900"> Centinela </h1>
                </div>
                <div className='flex h-full p-4'>
                    <span className="text-green-600 text-3xl ">info</span>
                </div>
            </aside>
            <main className="flex-1 flex flex-col overflow-hidden">
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