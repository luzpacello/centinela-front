import { isRouteErrorResponse, useRouteError } from 'react-router';

export function RouteErrorPage() {
  const error = useRouteError();
  return (
    <main className="mx-auto max-w-xl space-y-5 p-10 text-center">
      <h1>No pudimos abrir esta página</h1>
      <p role="alert">{isRouteErrorResponse(error) && error.status === 404 ? 'La página que buscás no existe.' : 'Ocurrió un error. Volvé a intentar desde el inicio de sesión.'}</p>
      <a href="/login" className="text-info underline">Ir al inicio de sesión</a>
    </main>
  );
}
