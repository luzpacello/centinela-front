export default function Sidebar() {
    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between h-full">

            {/* Logo */}
            <div>
                <div className="h-16 flex items-center px-6">
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
                        <span className="text-green-600 text-3xl leading-none"></span>
                        El Centinela
                    </h1>
                </div>

                {/* Menú de Navegación */}
                <nav className="px-3 py-2 space-y-1">
                    {/* Item normal */}
                    <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                        <span className="text-gray-400 text-lg"></span> Dashboard
                    </a>

                    {/* Item ACTIVO (Como se ve "Instancias" en la captura) */}
                    <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg bg-green-50 text-green-700">
                        <span className="text-green-600 text-lg"></span> Instancias
                    </a>

                    {/* Más items normales */}
                    <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                        <span className="text-gray-400 text-lg"></span> Crear instancia
                    </a>

                    <div className="pt-4 pb-2">
                        <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Sistema</p>
                    </div>
                    <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                        <span className="text-gray-400 text-lg"></span> Configuración
                    </a>
                </nav>
            </div>

            {/* Tarjeta de Estado y Perfil de Usuario */}
            <div className="p-4 space-y-4">

                {/* Tarjeta de Proxmox VE */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="font-semibold text-sm text-gray-900">Proxmox VE</span>
                        <span className="text-xs text-green-600 font-medium ml-auto bg-green-50 px-2 py-0.5 rounded-full">Conectado</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                        <div>
                            <p className="mb-0.5">Nodo</p>
                            <p className="font-medium text-gray-700">pve01</p>
                        </div>
                    </div>
                </div>

                {/* Perfil del Usuario */}
                <div className="flex items-center gap-3 pt-2">
                    <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center font-semibold text-white text-sm">
                        AD
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 leading-tight">Admin</p>
                        <p className="text-xs text-gray-500">Administrador</p>
                    </div>
                    <span className="text-gray-400 text-xs">▼</span>
                </div>

            </div>
        </aside>
    );
}