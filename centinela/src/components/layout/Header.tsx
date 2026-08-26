export default function Header() {
    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8 justify-between shrink-0">
            <h2 className="text-xl font-semibold text-gray-800">Panel de Control</h2>
            <button className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors">
                + Nueva Instancia
            </button>
        </header>
    );
}