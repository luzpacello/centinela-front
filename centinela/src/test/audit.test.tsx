import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { startOfDay, subMonths } from 'date-fns';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/services/apiClient';
import AuditoriaPage from '@/pages/Auditoria';
import { useLocation, useNavigate } from 'react-router';
import { HIDDEN_AUDIT_ACTIONS, auditActionLabel } from '@/utils/auditActionLabels';

const initialRoute = vi.hoisted(() => ({ search: '' }));

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
            const [params, setParams] = React.useState(() => new URLSearchParams(initialRoute.search));
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
    params.set('desde', subMonths(hoy, 1).toISOString());
    const endOfToday = new Date(hoy);
    endOfToday.setHours(23, 59, 59, 999);
    params.set('hasta', endOfToday.toISOString());
    return `/admin/audit?${params.toString()}`;
}

describe('AuditoriaPage', () => {
    const mockNavigate = vi.fn();

    // 2. Reseteamos y configuramos el estado inicial antes de cada test
    beforeEach(() => {
        vi.clearAllMocks();
        initialRoute.search = '';
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
        vi.mocked(apiClient.get).mockResolvedValue(mockAuditData);

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
        const user = userEvent.setup();
        await user.click(screen.getByRole('button', { name: 'Filtros' }));
        expect(await screen.findByRole('button', { name: 'Desde / Hasta' })).toBeInTheDocument();
        await user.keyboard('{Escape}');

        await userEvent.setup().click(screen.getByRole('button', { name: /ver detalles/i }));
        const detailDialog = screen.getByRole('dialog', { name: 'Detalle de auditoría' });
        expect(detailDialog).toHaveTextContent('UPID:node:task');
        expect(detailDialog).toHaveTextContent('[REDACTADO]');
        expect(detailDialog).not.toHaveTextContent('secret-value');
    });

    it('Reactividad de Filtros: rearma la consulta al elegir acción y resultado', async () => {
        vi.mocked(apiClient.get).mockResolvedValue({ total: 1, pagina: 1, items: [{ id: 'login-event', accion: 'LOGIN' }] });
        const user = userEvent.setup();
        render(<AuditoriaPage />);
        await screen.findByRole('button', { name: 'Ver detalles de Inicio de sesión' });

        vi.mocked(apiClient.get).mockClear();

        // El texto de la acción se toma del catálogo compartido con la interfaz.
        await user.click(screen.getByRole('button', { name: 'Filtros' }));
        await user.click(await screen.findByRole('menuitemradio', { name: auditActionLabel('LOGIN') }));
        await user.click(screen.getByRole('tab', { name: /exitosos/i }));

        await waitFor(() => {
            expect(apiClient.get).toHaveBeenCalledWith(
                urlAuditoria({ accion: 'LOGIN', resultado: 'EXITO' }),
                expect.objectContaining({ signal: expect.any(AbortSignal) }),
            );
        });
    });

    it.each([
        ['Éxito', 'EXITO'], ['Falla', 'FALLA'], ['En curso', 'PENDIENTE'],
    ])('el filtro %s envía el resultado canónico %s también al exportar', async (label, result) => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true, headers: new Headers(), blob: async () => new Blob(['{}']),
        } as Response);
        const user = userEvent.setup();
        render(<AuditoriaPage />);
        await screen.findByText('Todavía no hay registros de auditoría para mostrar.');
        await user.click(screen.getByRole('button', { name: 'Filtros' }));
        await user.click(await screen.findByRole('menuitemradio', { name: label }));
        await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith(
            urlAuditoria({ resultado: result }), expect.any(Object),
        ));
        await user.click(screen.getByRole('button', { name: 'Exportar registros' }));
        await user.click(await screen.findByRole('menuitem', { name: 'Exportar auditoría en formato JSON' }));
        await waitFor(() => expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining(`resultado=${result}`), expect.any(Object),
        ));
        const requestedResults = vi.mocked(apiClient.get).mock.calls
            .map(([path]) => new URLSearchParams(path.split('?')[1]).get('resultado')).filter(Boolean);
        expect(requestedResults.every((value) => ['EXITO', 'FALLA', 'PENDIENTE'].includes(value!))).toBe(true);
    });

    it('no reenvía filtros de enlaces antiguos o ajenos al enum del backend', async () => {
        initialRoute.search = 'accion=START_VM&resultado=SUCCESS';
        render(<AuditoriaPage />);
        await screen.findByText('Todavía no hay registros de auditoría para mostrar.');
        for (const [path] of vi.mocked(apiClient.get).mock.calls) {
            const params = new URLSearchParams(path.split('?')[1]);
            expect(params.has('accion')).toBe(false);
            expect(params.get('resultado')).not.toBe('SUCCESS');
        }
    });

    it('mantiene los filtros al cambiar el tamaño de página y envía el tipo de recurso', async () => {
        vi.mocked(apiClient.get).mockResolvedValue({ total: 1, pagina: 1, items: [{ id: 'vm-event', accion: 'LOGIN', recursoTipo: 'VM' }] });
        const user = userEvent.setup();
        render(<AuditoriaPage />);
        await screen.findByRole('button', { name: 'Ver detalles de Inicio de sesión' });
        vi.mocked(apiClient.get).mockClear();

        await user.click(screen.getByRole('button', { name: 'Filtros' }));
        await user.click(await screen.findByRole('menuitemradio', { name: 'VM' }));
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
        const downloadedFilenames: string[] = [];
        const clickDownload = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
            downloadedFilenames.push(this.download);
        });
        // 1. Configuramos el mock de fetch específicamente para este test
        // Simulamos que la API responde OK y nos devuelve un "archivo" (Blob)
        vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({
            ok: true,
            headers: new Headers({ 'Content-Disposition': 'attachment; filename="auditoria_centinela.csv"' }),
            blob: async () => new Blob(['datos falsos'], { type: 'text/csv' })
        }));

        render(<AuditoriaPage />);

        // 2. Buscamos el botón de exportar. 
        // Usamos una expresión regular /exportar/i para que no le importe mayúsculas o minúsculas
        const botonExportar = screen.getByRole('button', { name: 'Exportar registros' });

        // 3. Simulamos el clic
        fireEvent.click(botonExportar);
        fireEvent.click(screen.getByRole('menuitem', { name: 'Exportar auditoría en formato CSV' }));

        // 4. Verificamos que se haya ejecutado el fetch con los parámetros esperados
        await waitFor(() => {
            // Usamos expect.stringContaining porque la URL base puede cambiar según las variables de entorno
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/admin/audit/export?format=csv'),
                expect.objectContaining({
                    headers: { Authorization: 'Bearer fake-token' },
                    credentials: 'include',
                })
            );
            expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('desde=');
            expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('hasta=');
            expect(URL.createObjectURL).toHaveBeenCalledOnce();
            expect(clickDownload).toHaveBeenCalledOnce();
            expect(downloadedFilenames).toEqual(['auditoria_centinela.csv']);
            expect(URL.revokeObjectURL).toHaveBeenCalledOnce();
        });

        // 5. Verificamos que la vista no se haya roto comprobando que el título siga ahí
        expect(screen.getByText('Auditoría')).toBeInTheDocument();

        // 6. Verificamos que NO haya aparecido el mensaje de error de exportación en pantalla
        // queryByText devuelve null si no lo encuentra (a diferencia de getByText que tira error)
        expect(screen.queryByText('No se pudo exportar la auditoría. Intentá nuevamente.')).not.toBeInTheDocument();
    });

    it('ofrece exportación JSON y envía el formato elegido', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: true,
            headers: new Headers(),
            blob: async () => new Blob(['{}'], { type: 'application/json' }),
        } as Response);

        render(<AuditoriaPage />);
        fireEvent.click(screen.getByRole('button', { name: 'Exportar registros' }));
        await screen.findByRole('menuitem', { name: 'Exportar auditoría en formato JSON' });
        fireEvent.click(screen.getByRole('menuitem', { name: 'Exportar auditoría en formato JSON' }));

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/admin/audit/export?format=json'),
                expect.objectContaining({ credentials: 'include' }),
            );
        });
    });

    it('busca por el nombre recibido al navegar sin seleccionar al usuario en Filtros', async () => {
        // Llegar con estado de navegación es lo que motivó useLocation en la página.
        vi.mocked(useLocation).mockReturnValue({
            pathname: '/auditoria',
            search: '',
            hash: '',
            state: { auditUser: { id: 'u-7', label: 'Carlos Admin' } },
            key: 'default',
        } as unknown as ReturnType<typeof useLocation>);

        vi.mocked(apiClient.get).mockResolvedValue({ total: 2, pagina: 1, items: [
            { id: 'user-event', usuarioId: 'u-7', nombreUsuario: 'Carlos Admin', accion: 'LOGIN' },
            { id: 'another-user-event', usuarioId: 'u-8', nombreUsuario: 'Susana Operadora', accion: 'LOGIN' },
        ] });
        render(<AuditoriaPage />);

        expect(screen.getByLabelText('Buscar en auditoría')).toHaveValue('Carlos Admin');
        expect(await within(screen.getByRole('table')).findByText('Carlos Admin')).toBeInTheDocument();
        expect(within(screen.getByRole('table')).queryByText('Susana Operadora')).not.toBeInTheDocument();
        expect(vi.mocked(apiClient.get).mock.calls.every(([path]) => !path.includes('usuarioId='))).toBe(true);
        const user = userEvent.setup();
        await user.click(screen.getByRole('button', { name: 'Filtros' }));
        expect(await screen.findByRole('menuitemradio', { name: 'Todos los usuarios' })).toHaveAttribute('aria-checked', 'true');
        expect(screen.getByRole('menuitemradio', { name: 'Carlos Admin' })).toHaveAttribute('aria-checked', 'false');
        await user.keyboard('{Escape}');
        await user.clear(screen.getByLabelText('Buscar en auditoría'));
        await waitFor(() => {
            expect(screen.getByLabelText('Buscar en auditoría')).toHaveValue('');
            expect(vi.mocked(apiClient.get).mock.calls.every(([path]) => !path.includes('usuarioId='))).toBe(true);
        });
        expect(await within(screen.getByRole('table')).findByText('Susana Operadora')).toBeInTheDocument();
    });

    it('precarga opciones de páginas posteriores y busca registros fuera de la página visible', async () => {
        const records = Array.from({ length: 101 }, (_, index) => ({
            id: `event-${index}`, usuarioId: index === 100 ? 'old-user' : 'recent-user',
            nombreUsuario: index === 100 ? 'Operador antiguo' : 'Operador reciente',
            accion: index === 100 || index === 0 ? 'INICIAR_VM' : 'LOGIN',
            recursoTipo: 'VM', recursoId: `inst_${index}`, resultado: 'EXITO',
            fechaHora: '2026-01-01T09:00:00Z',
        }));
        vi.mocked(apiClient.get).mockImplementation(async (path) => {
            const params = new URLSearchParams(path.split('?')[1]);
            const page = Number(params.get('pagina'));
            const size = Number(params.get('tamano'));
            const filtered = records.filter((event) => (!params.get('usuarioId') || event.usuarioId === params.get('usuarioId'))
                && (!params.get('accion') || event.accion === params.get('accion')));
            return { total: filtered.length, pagina: page, limit: size, items: filtered.slice((page - 1) * size, page * size) };
        });
        const user = userEvent.setup();
        render(<AuditoriaPage />);
        await within(screen.getByRole('table')).findAllByText('Operador reciente');
        expect(within(screen.getByRole('table')).queryByText('Operador antiguo')).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Filtros' }));
        expect(await screen.findByRole('menuitemradio', { name: 'Operador antiguo' })).toBeInTheDocument();
        expect(screen.getAllByRole('menuitemradio', { name: 'Instancia iniciada' })).toHaveLength(1);
        expect(screen.queryByRole('menuitemradio', { name: 'Snapshot creado' })).not.toBeInTheDocument();
        expect(screen.queryByRole('menuitemradio', { name: 'HOST' })).not.toBeInTheDocument();
        await user.keyboard('{Escape}');
        vi.mocked(apiClient.get).mockClear();
        await user.click(screen.getByRole('button', { name: 'Siguiente' }));
        await screen.findByText('Página 2 de 11 (101 eventos en total)');
        await user.click(screen.getByRole('button', { name: 'Filtros' }));
        expect(await screen.findByRole('menuitemradio', { name: 'Operador antiguo' })).toBeInTheDocument();
        await user.keyboard('{Escape}');
        expect(vi.mocked(apiClient.get).mock.calls.some(([path]) => path.includes('tamano=100'))).toBe(false);

        await user.type(screen.getByLabelText('Buscar en auditoría'), 'Operador antiguo');
        expect(await within(screen.getByRole('table')).findByText('Operador antiguo')).toBeInTheDocument();
        expect(screen.getByText('Página 1 de 1 (1 eventos en total)')).toBeInTheDocument();
        await user.clear(screen.getByLabelText('Buscar en auditoría'));
        await within(screen.getByRole('table')).findAllByText('Operador reciente');
        await user.click(screen.getByRole('button', { name: 'Filtros' }));
        await user.click(await screen.findByRole('menuitemradio', { name: 'Instancia iniciada' }));
        await waitFor(() => expect(screen.getByText('Página 1 de 1 (2 eventos en total)')).toBeInTheDocument());
        expect(within(screen.getByRole('table')).getByText('Operador antiguo')).toBeInTheDocument();
        expect(within(screen.getByRole('table')).getByText('Operador reciente')).toBeInTheDocument();
    });

    it('mantiene los contadores globales al alternar resultados y paginar la tabla filtrada', async () => {
        vi.mocked(apiClient.get).mockImplementation(async (path) => {
            const params = new URLSearchParams(path.split('?')[1]);
            const result = params.get('resultado');
            return {
                total: result === 'EXITO' ? 17 : result === 'FALLA' ? 4 : 23,
                pagina: Number(params.get('pagina')),
                items: [{
                    id: result || 'all', nombreUsuario: result === 'FALLA' ? 'Usuario fallido' : 'Usuario exitoso',
                    accion: 'LOGIN', resultado: result || 'EXITO',
                }],
            };
        });
        const user = userEvent.setup();
        render(<AuditoriaPage />);
        const allTab = screen.getByRole('tab', { name: /eventos totales/i });
        const successTab = screen.getByRole('tab', { name: /exitosos/i });
        const failureTab = screen.getByRole('tab', { name: /fallidos/i });
        await waitFor(() => {
            expect(allTab).toHaveTextContent('23');
            expect(successTab).toHaveTextContent('17');
            expect(failureTab).toHaveTextContent('4');
        });
        vi.mocked(apiClient.get).mockClear();

        await user.click(successTab);
        await screen.findByText('Página 1 de 2 (17 eventos en total)');
        expect(allTab).toHaveTextContent('23');
        expect(successTab).toHaveTextContent('17');
        expect(failureTab).toHaveTextContent('4');
        expect(apiClient.get).toHaveBeenCalledTimes(1);

        const nextPage = screen.getByRole('button', { name: 'Siguiente' });
        expect(nextPage.textContent).toBe('');
        expect(screen.getByRole('button', { name: 'Anterior' }).textContent).toBe('');
        await user.click(nextPage);
        await screen.findByText('Página 2 de 2 (17 eventos en total)');
        expect(allTab).toHaveTextContent('23');

        await user.click(failureTab);
        expect(await within(screen.getByRole('table')).findByText('Usuario fallido')).toBeInTheDocument();
        expect(allTab).toHaveTextContent('23');
        expect(successTab).toHaveTextContent('17');
        expect(failureTab).toHaveTextContent('4');
        expect(screen.getByText('Página 1 de 1 (4 eventos en total)')).toBeInTheDocument();
    });

    it('conserva registros de distintas familias y cuenta resultados canónicos durante la búsqueda', async () => {
        const actions = ['LOGIN', 'VERIFICAR_2FA', 'CREAR_USUARIO', 'INICIAR_VM', 'LOGIN_FALLA', 'CONFIG_UPDATED'];
        const records = actions.map((accion, index) => ({
            id: `canonical-${index}`, accion, nombreUsuario: `Operador ${index}`,
            resultado: index < 4 ? 'EXITO' : index === 4 ? 'FALLA' : 'PENDIENTE',
        }));
        vi.mocked(apiClient.get).mockResolvedValue({ total: records.length, pagina: 1, items: records });
        const user = userEvent.setup();
        render(<AuditoriaPage />);
        await user.type(screen.getByLabelText('Buscar en auditoría'), 'Operador');
        const allTab = screen.getByRole('tab', { name: /eventos totales/i });
        const successTab = screen.getByRole('tab', { name: /exitosos/i });
        const failureTab = screen.getByRole('tab', { name: /fallidos/i });
        await waitFor(() => {
            expect(allTab).toHaveTextContent('6');
            expect(successTab).toHaveTextContent('4');
            expect(failureTab).toHaveTextContent('1');
        });
        await user.click(successTab);
        for (let index = 0; index < 4; index++) {
            expect(within(screen.getByRole('table')).getByText(`Operador ${index}`)).toBeInTheDocument();
        }
        expect(within(screen.getByRole('table')).queryByText('Operador 4')).not.toBeInTheDocument();
        await user.click(failureTab);
        expect(within(screen.getByRole('table')).getByText('Operador 4')).toBeInTheDocument();
        expect(within(screen.getByRole('table')).queryByText('Operador 0')).not.toBeInTheDocument();
        expect(allTab).toHaveTextContent('6');
        expect(successTab).toHaveTextContent('4');
    });

    it('envía el rango consolidado desde el selector de fechas dentro de Filtros', async () => {
        const user = userEvent.setup();
        const today = startOfDay(new Date());
        const firstDate = subMonths(today, 1);
        firstDate.setDate(10);
        const lastDate = new Date(firstDate);
        lastDate.setDate(12);
        render(<AuditoriaPage />);
        await screen.findByText('Todavía no hay registros de auditoría para mostrar.');
        expect(screen.queryByRole('button', { name: 'Desde / Hasta' })).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Filtros' }));
        await user.click(await screen.findByRole('button', { name: 'Desde / Hasta' }));
        const startButton = screen.getAllByRole('button').find((button) => button.getAttribute('data-day') === firstDate.toLocaleDateString());
        expect(startButton).toBeDefined();
        await user.click(startButton!);
        const endButton = screen.getAllByRole('button').find((button) => button.getAttribute('data-day') === lastDate.toLocaleDateString());
        expect(endButton).toBeDefined();
        await user.click(endButton!);
        await waitFor(() => {
            const endOfRange = new Date(lastDate);
            endOfRange.setHours(23, 59, 59, 999);
            const matchedRequest = vi.mocked(apiClient.get).mock.calls.find(([path]) => {
                const params = new URLSearchParams(path.split('?')[1]);
                return params.get('desde') === firstDate.toISOString() && params.get('hasta') === endOfRange.toISOString();
            });
            expect(matchedRequest).toBeDefined();
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
