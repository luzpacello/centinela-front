import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <main className="mx-auto max-w-xl space-y-5 p-10 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">Página no encontrada</h1>
      <p className="text-gray-500">La página que buscás no existe.</p>
      <Link to="/login" className="text-info underline">Ir al inicio de sesión</Link>
    </main>
  );
}
