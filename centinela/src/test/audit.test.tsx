import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { format, startOfDay, subMonths } from 'date-fns';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/services/apiClient';
import AuditoriaPage from '@/pages/Auditoria';
import { useLocation, useNavigate } from 'react-router';
import { HIDDEN_AUDIT_ACTIONS, auditActionLabel } from '@/utils/auditActionLabels';

// 1. Mock de las dependencias de tu proyecto
vi.mock('@/services/apiClient', () => {
    return {
        apiClient: {
            get: vi.fn(),
        },
        // Mockeamos la clase de error porque la usás en un instanceof
        ApiRequestError: class extends Error {
            constructor(message: string) {
                super(message);
                this.name = 'ApiRequestError';
            }
        },
    };
});

vi.mock('@/storage/tokenStorage', () => {
    return {
        getAccessToken: vi.fn(() => 'fake-token'),
    };
});

// Mockeamos el router para espiar si la app intenta cambiar de página
vi.mock('react-router', async () => {
    const React = await import('react');
    return {
        useNavigate: vi.fn(),
        // La página lee el estado de navegación para llegar con un usuario prefiltrado.
        useLocation: vi.fn(),
        useSearchParams: () => {
            const [params, setParams] = React.useState(() => new URLSearchParams());
            const setSearchParams = React.useCallback((next: URLSearchParams | ((current: URLSearchParams) => URLSearchParams)) => {
                setParams((current) => new URLSearchParams(
                    typeof next === 'function' ? next(new URLSearchParams(current)) : next,
                ));
            }, []);
            return [params, setSearchParams];
        },
    };
});

// Mockeamos el contexto de usuario
vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn(),
}));


// La página abre con el rango por defecto (último mes) y arma la consulta en este
// orden: pagina, tamano, acciones excluidas, filtros y por último el rango de fechas.
// Se replica con URLSearchParams para no duplicar el escapado: la coma de la lista
// de acciones excluidas viaja como %2C.
function urlAuditoria({ accion = '', resultado = '' }: { accion?: string; resultado?: string } = {}) {
    const hoy = startOfDay(new Date());
    const params = new URLSearchParams({
        pagina: '1',
        tamano: '10',
        excluirAccion: HIDDEN_AUDIT_ACTIONS.join(','),
    });
    if (accion) params.set('accion', accion);
    if (resultado) params.set('resultado', resultado);
    params.set('desde', format(subMonths(hoy, 1), 'yyyy-MM-dd'));
    params.set('hasta', format(hoy, 'yyyy-MM-dd'));
    return `/admin/audit?${params.toString()}`;
}

describe('AuditoriaPage', () => {
    const mockNavigate = vi.fn();

    // 2. Reseteamos y configuramos el estado inicial antes de cada test
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
        vi.mocked(useLocation).mockReturnValue({
            pathname: '/auditoria',
            search: '',
            hash: '',
            state: null,
            key: 'default',
        } as unknown as ReturnType<typeof useLocation>);

        window.sessionStorage.clear();
        window.sessionStorage.setItem('centinela_user', JSON.stringify({ nombre: 'Admin Test', rol: 'ADMIN' }));

        // Respuesta por defecto de la API: Sin resultados
        vi.mocked(apiClient.get).mockResolvedValue({
            total: 0,
            pagina: 1,
            items: [],
        });

        // Mocks de funciones del navegador necesarias para la exportación CSV
        vi.stubGlobal('URL', {
            createObjectURL: vi.fn(() => 'blob:fake-url'),
            revokeObjectURL: vi.fn(),
        });
        vi.stubGlobal('fetch', vi.fn());
    });

    // 3. Nuestro primer test
    it('debe renderizar la página correctamente y mostrar estado vacío si no hay datos', async () => {
        render(<AuditoriaPage />);

        // Verifica que el título cargue
        expect(screen.getByText('Auditoría')).toBeInTheDocument();

        // Verifica que llamó a la API en el useEffect (página 1, tamaño 10)
        expect(apiClient.get).toHaveBeenCalledWith(
            urlAuditoria(),
            expect.any(Object)
        );

        // Espera a que termine el loading y aparezca el mensaje de tabla vacía
        const mensajeVacio = await screen.findByText('Todavía no hay registros de auditoría para mostrar.');
        expect(mensajeVacio).toBeInTheDocument();
    });

    it('Renderizado Inicial: debe solicitar la primera página y renderizar las filas simuladas', async () => {
        // 1. Preparamos el mock de datos
        const mockAuditData = {
            total: 1,
            pagina: 1,
            items: [
                {
                    id: 'test-inicial-1',
                    nombreUsuario: 'Carlos Admin',
                    accion: 'CREAR_ROL',
                    recursoTipo: 'VM',
                    recursoId: 'vm-12',
                    instanciaNombre: 'Roles',
                    resultado: 'EXITO',
                    fechaHora: '2023-11-01T09:00:00Z',
                    detalles: { upid: 'UPID:node:task', authToken: 'secret-value', exitstatus: 'OK' },
                }
            ]
        };

        // Configuramos la respuesta de la API
        vi.mocked(apiClient.get).mockResolvedValueOnce(mockAuditData);

        // 2. Montamos el componente
        render(<AuditoriaPage />);

        // 3. Verificamos que se haya despachado la petición GET con los parámetros correctos
        // Nota: El token Bearer se asume configurado dentro de la implementación real de apiClient,
        // por lo que aquí validamos que el componente consuma la ruta exacta.
        expect(apiClient.get).toHaveBeenCalledWith(
            urlAuditoria(),
            expect.objectContaining({
                signal: expect.any(AbortSignal) // Verificamos que también pase el controller para cancelar peticiones
            })
        );

        // 4. Verificamos que la tabla renderice correctamente la fila simulada
        // Buscamos elementos clave que confirmen que la fila está en el DOM
        const usuarioRenderizado = await screen.findByText('Carlos Admin');
        expect(usuarioRenderizado).toBeInTheDocument();
        // La tabla muestra la etiqueta legible de la acción, no el código crudo.
        expect(screen.getByText(auditActionLabel('CREAR_ROL'))).toBeInTheDocument();
        expect(screen.getByText(/Roles/)).toBeInTheDocument();
        expect(screen.getByLabelText('Desde')).toBeInTheDocument();
        expect(screen.getByLabelText('Hasta')).toBeInTheDocument();

        await userEvent.setup().click(screen.getByRole('button', { name: /ver detalles/i }));
        const detailDialog = screen.getByRole('dialog', { name: 'Detalle de auditoría' });
        expect(detailDialog).toHaveTextContent('UPID:node:task');
        expect(detailDialog).toHaveTextContent('[REDACTADO]');
        expect(detailDialog).not.toHaveTextContent('secret-value');
    });

    it('Reactividad de Filtros: rearma la consulta al elegir acción y resultado', async () => {
        const user = userEvent.setup();
        render(<AuditoriaPage />);
        await screen.findByText('Todavía no hay registros de auditoría para mostrar.');

        vi.mocked(apiClient.get).mockClear();

        // El texto de la acción se toma del catálogo compartido con la interfaz.
        await user.selectOptions(screen.getByLabelText('Acción'), 'LOGIN');
        await user.click(screen.getByRole('tab', { name: /exitosos/i }));

        await waitFor(() => {
            expect(apiClient.get).toHaveBeenCalledWith(
                urlAuditoria({ accion: 'LOGIN', resultado: 'SUCCESS' }),
                expect.objectContaining({ signal: expect.any(AbortSignal) }),
            );
        });
    });

    it('mantiene los filtros al cambiar el tamaño de página y envía el tipo de recurso', async () => {
        const user = userEvent.setup();
        render(<AuditoriaPage />);
        await screen.findByText('Todavía no hay registros de auditoría para mostrar.');
        vi.mocked(apiClient.get).mockClear();

        await user.selectOptions(screen.getByLabelText('Tipo de recurso'), 'VM');
        await user.selectOptions(screen.getByLabelText('Registros por página'), '25');

        await waitFor(() => {
            expect(apiClient.get).toHaveBeenCalledWith(
                expect.stringContaining('tamano=25'),
                expect.objectContaining({ signal: expect.any(AbortSignal) }),
            );
            expect(apiClient.get).toHaveBeenCalledWith(
                expect.stringContaining('recursoTipo=VM'),
                expect.objectContaining({ signal: expect.any(AbortSignal) }),
            );
        });
    });

    it('Flujo de Exportación: debe llamar a la API de exportación al hacer clic en Exportar', async () => {
        // 1. Configuramos el mock de fetch específicamente para este test
        // Simulamos que la API responde OK y nos devuelve un "archivo" (Blob)
        vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
            ok: true,
            blob: async () => new Blob(['datos falsos'], { type: 'text/csv' })
        }));

        render(<AuditoriaPage />);

        // 2. Buscamos el botón de exportar. 
        // Usamos una expresión regular /exportar/i para que no le importe mayúsculas o minúsculas
        const botonExportar = screen.getByRole('button', { name: /exportar/i });

        // 3. Simulamos el clic
        fireEvent.click(botonExportar);

        // 4. Verificamos que se haya ejecutado el fetch con los parámetros esperados
        await waitFor(() => {
            // Usamos expect.stringContaining porque la URL base puede cambiar según las variables de entorno
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/admin/audit/export?formato=csv'),
                expect.objectContaining({
                    headers: { Authorization: 'Bearer fake-token' },
                    credentials: 'include',
                })
            );
        });

        // 5. Verificamos que la vista no se haya roto comprobando que el título siga ahí
        expect(screen.getByText('Auditoría')).toBeInTheDocument();

        // 6. Verificamos que NO haya aparecido el mensaje de error de exportación en pantalla
        // queryByText devuelve null si no lo encuentra (a diferencia de getByText que tira error)
        expect(screen.queryByText('No se pudo exportar la auditoría. Intentá nuevamente.')).not.toBeInTheDocument();
    });

    it('prefiltra el usuario que llega desde el listado de usuarios', async () => {
        // Llegar con estado de navegación es lo que motivó useLocation en la página.
        vi.mocked(useLocation).mockReturnValue({
            pathname: '/auditoria',
            search: '',
            hash: '',
            state: { auditUser: { id: 'u-7', label: 'Carlos Admin' } },
            key: 'default',
        } as unknown as ReturnType<typeof useLocation>);

        render(<AuditoriaPage />);

        expect(screen.getByLabelText('Buscar en auditoría')).toHaveValue('Carlos Admin');

        await waitFor(() => {
            expect(apiClient.get).toHaveBeenCalledWith(
                expect.stringContaining('usuarioId=u-7'),
                expect.anything(),
            );
        });
    });

    it('Seguridad (Guardias): debe redireccionar a /dashboard y no llamar a la API si el rol es OPERATOR', () => {
        window.sessionStorage.setItem('centinela_user', JSON.stringify({ nombre: 'Operador Test', rol: 'OPERATOR' }));
        vi.mocked(apiClient.get).mockClear();

        render(<AuditoriaPage />);

        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', expect.objectContaining({ replace: true }));
        expect(apiClient.get).not.toHaveBeenCalled();
    });
});
