import '@testing-library/jest-dom/vitest';
import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Mail } from 'lucide-react';

import MainLayoutAuth from '@/components/layout_auth/MainLayoutAuth';
import { AuthenticationInputField } from '@/components/features/auth/components/AuthenticationInputField';

const HEADLINE = 'Gestioná tus entornos virtuales de forma simple';
const INTRO =
    'Centinela te permite administrar, monitorear y operar tus máquinas virtuales y contenedores Proxmox VE en tiempo real desde una interfaz moderna, segura y fácil de usar.';
const FEATURE_1_TITLE = 'Control centralizado';
const FEATURE_1_DESC = 'Administrá todas tus instancias desde un solo lugar.';
const FEATURE_2_TITLE = 'Monitoreo en tiempo real';
const FEATURE_2_DESC = 'Visualizá el uso de recursos y el estado de tus instancias al instante.';
const FEATURE_3_TITLE = 'Seguro y confiable';
const FEATURE_3_DESC =
    'Conexión segura con tu servidor Proxmox y protección con doble factor (2FA).';

describe('Onboarding de la columna lateral de autenticación (86e3kz4du)', () => {
    it('muestra el copy informativo aprobado con las tres features', () => {
        render(<MainLayoutAuth>formulario</MainLayoutAuth>);

        expect(screen.queryByText(/imagenes y informacion random/i)).not.toBeInTheDocument();
        expect(screen.getByRole('heading', { name: HEADLINE })).toBeInTheDocument();
        expect(screen.getByText(INTRO)).toBeInTheDocument();
        expect(screen.getByText(FEATURE_1_TITLE)).toBeInTheDocument();
        expect(screen.getByText(FEATURE_1_DESC)).toBeInTheDocument();
        expect(screen.getByText(FEATURE_2_TITLE)).toBeInTheDocument();
        expect(screen.getByText(FEATURE_2_DESC)).toBeInTheDocument();
        expect(screen.getByText(FEATURE_3_TITLE)).toBeInTheDocument();
        expect(screen.getByText(FEATURE_3_DESC)).toBeInTheDocument();
        expect(screen.getByText(/2FA/)).toBeInTheDocument();
    });

    it('muestra la marca de Centinela con su logo', () => {
        render(<MainLayoutAuth>formulario</MainLayoutAuth>);

        expect(screen.getByAltText('Centinela')).toBeInTheDocument();
    });

    it('oculta la columna lateral en móvil y la muestra en escritorio', () => {
        render(<MainLayoutAuth>formulario</MainLayoutAuth>);

        const aside = screen.getByRole('complementary');
        expect(aside).toHaveClass('hidden');
        expect(aside).toHaveClass('lg:flex');
    });

    it('mantiene el formulario principal montado en el layout', () => {
        render(<MainLayoutAuth>formulario-de-prueba</MainLayoutAuth>);

        expect(screen.getByText('formulario-de-prueba')).toBeInTheDocument();
    });
});

describe('Titular con efecto de máquina de escribir', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    it('expone el titular como heading con el nombre accesible completo', () => {
        render(<MainLayoutAuth>formulario</MainLayoutAuth>);

        expect(screen.getByRole('heading', { name: HEADLINE })).toBeInTheDocument();
    });

    it('escribe el titular letra por letra y luego lo completa, sin dejar timers colgados', () => {
        vi.useFakeTimers();
        const { unmount } = render(<MainLayoutAuth>formulario</MainLayoutAuth>);

        const animated = screen.getByTestId('typewriter-text');
        expect(animated.textContent).not.toBe(HEADLINE);

        // Un paso por letra: cada avance deja correr el efecto que programa el siguiente timer.
        for (let step = 0; step < HEADLINE.length + 1; step++) {
            act(() => {
                vi.advanceTimersByTime(60);
            });
        }
        expect(screen.getByTestId('typewriter-text').textContent).toBe(HEADLINE);

        unmount();
        vi.clearAllTimers();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('con prefers-reduced-motion reduce muestra el titular completo sin animación', () => {
        const mediaQueryList = {
            matches: true,
            media: '(prefers-reduced-motion: reduce)',
            onchange: null,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn(),
            dispatchEvent: vi.fn(() => false),
        } as unknown as MediaQueryList;
        vi.stubGlobal('matchMedia', vi.fn(() => mediaQueryList));

        render(<MainLayoutAuth>formulario</MainLayoutAuth>);

        expect(screen.getByTestId('typewriter-text').textContent).toBe(HEADLINE);
    });
});

describe('AuthenticationInputField: prop de ícono aditiva', () => {
    it('renderiza el ícono izquierdo cuando se pasa', () => {
        render(<AuthenticationInputField id="t-email" label="Correo" icon={<Mail data-testid="mail-icon" />} />);

        expect(screen.getByLabelText('Correo')).toBeInTheDocument();
        expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
    });

    it('sigue funcionando sin ícono para no romper los otros usos', () => {
        render(<AuthenticationInputField id="t-pass" label="Contraseña" type="password" />);

        expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Mostrar contraseña' })).toBeInTheDocument();
    });
});
