/* eslint-disable @typescript-eslint/no-explicit-any, no-undef */
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/services/apiClient';
import AuditoriaPage from '@/pages/Auditoria';
import { useNavigate } from 'react-router';

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
vi.mock('react-router', () => ({
    useNavigate: vi.fn(),
}));

// Mockeamos el contexto de usuario
vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn(),
}));

describe('AuditoriaPage', () => {
    const mockNavigate = vi.fn();

    // 2. Reseteamos y configuramos el estado inicial antes de cada test
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);

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
            '/admin/audit?pagina=1&tamano=10',
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
                    instanciaNombre: 'Roles',
                    resultado: 'EXITO',
                    fechaHora: '2023-11-01T09:00:00Z',
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
            '/admin/audit?pagina=1&tamano=10',
            expect.objectContaining({
                signal: expect.any(AbortSignal) // Verificamos que también pase el controller para cancelar peticiones
            })
        );

        // 4. Verificamos que la tabla renderice correctamente la fila simulada
        // Buscamos elementos clave que confirmen que la fila está en el DOM
        const usuarioRenderizado = await screen.findByText('Carlos Admin');
        expect(usuarioRenderizado).toBeInTheDocument();
        expect(screen.getByText('CREAR_ROL')).toBeInTheDocument();
        expect(screen.getByText('Roles')).toBeInTheDocument();
    });

    it('Reactividad de Filtros: debe invocar al endpoint con los query params al cambiar los filtros', async () => {
        render(<AuditoriaPage />);

        // 1. Obtenemos los inputs mediante el aria-label que Nico les configuró
        const inputDesde = screen.getByLabelText('Desde');
        const inputHasta = screen.getByLabelText('Hasta');
        const inputAccion = screen.getByLabelText('Acción');
        const selectResultado = screen.getByLabelText('Resultado');

        // Limpiamos el registro del mock para ignorar la llamada inicial del montaje
        vi.mocked(apiClient.get).mockClear();

        // 2. Simulamos que el usuario completa los filtros
        fireEvent.change(inputDesde, { target: { value: '2023-10-01' } });
        fireEvent.change(inputHasta, { target: { value: '2023-10-31' } });
        fireEvent.change(inputAccion, { target: { value: 'LOGIN' } });
        fireEvent.change(selectResultado, { target: { value: 'EXITO' } });

        // 3. Verificamos que la URL se arme correctamente con todos los parámetros
        // Usamos waitFor porque los cambios de estado en React son asíncronos y 
        // pueden agruparse (batching) antes de disparar el useEffect.
        await waitFor(() => {
            // El orden de los parámetros coincide con cómo se hace el "params.set" en tu componente
            expect(apiClient.get).toHaveBeenCalledWith(
                '/admin/audit?pagina=1&tamano=10&accion=LOGIN&resultado=EXITO&desde=2023-10-01&hasta=2023-10-31',
                expect.objectContaining({
                    signal: expect.any(AbortSignal)
                })
            );
        });
    });

    it('Reactividad de Filtros: debe invocar al endpoint con los query params al cambiar los filtros', async () => {
        render(<AuditoriaPage />);

        // 1. Obtenemos los inputs mediante el aria-label que Nico les configuró
        const inputDesde = screen.getByLabelText('Desde');
        const inputHasta = screen.getByLabelText('Hasta');
        const inputAccion = screen.getByLabelText('Acción');
        const selectResultado = screen.getByLabelText('Resultado');

        // Limpiamos el registro del mock para ignorar la llamada inicial del montaje
        vi.mocked(apiClient.get).mockClear();

        // 2. Simulamos que el usuario completa los filtros
        fireEvent.change(inputDesde, { target: { value: '2023-10-01' } });
        fireEvent.change(inputHasta, { target: { value: '2023-10-31' } });
        fireEvent.change(inputAccion, { target: { value: 'LOGIN' } });
        fireEvent.change(selectResultado, { target: { value: 'EXITO' } });

        // 3. Verificamos que la URL se arme correctamente con todos los parámetros
        // Usamos waitFor porque los cambios de estado en React son asíncronos y 
        // pueden agruparse (batching) antes de disparar el useEffect.
        await waitFor(() => {
            // El orden de los parámetros coincide con cómo se hace el "params.set" en tu componente
            expect(apiClient.get).toHaveBeenCalledWith(
                '/admin/audit?pagina=1&tamano=10&accion=LOGIN&resultado=EXITO&desde=2023-10-01&hasta=2023-10-31',
                expect.objectContaining({
                    signal: expect.any(AbortSignal)
                })
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

    it('Seguridad (Guardias): debe redireccionar a /dashboard y no llamar a la API si el rol es OPERATOR', () => {
        window.sessionStorage.setItem('centinela_user', JSON.stringify({ nombre: 'Operador Test', rol: 'OPERATOR' }));
        vi.mocked(apiClient.get).mockClear();

        render(<AuditoriaPage />);

        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', expect.objectContaining({ replace: true }));
        expect(apiClient.get).not.toHaveBeenCalled();
    });
});

