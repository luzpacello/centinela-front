import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// El bloque de diagnostico temporal se mockea para aislar el copy de onboarding
// y comprobar que el layout sigue montandolo al pie de la columna lateral.
vi.mock('@/components/InfraDeployCheck', () => ({
    default: () => <div data-testid="infra-deploy-check" />,
}));

import MainLayoutAuth from '@/components/layout_auth/MainLayoutAuth';

const BLOCK_1_TITLE = 'Tu infraestructura virtual, simplificada y bajo control';
const BLOCK_1_DESC =
    'Centinela te permite administrar, monitorear y operar tus máquinas virtuales y contenedores Proxmox VE en tiempo real desde un entorno ágil, intuitivo y seguro.';
const BLOCK_2_TITLE = 'Protección de infraestructura con doble factor';
const BLOCK_2_DESC =
    'Gestionar servidores requiere la máxima seguridad. El 2FA añade una capa de protección indispensable para salvaguardar tus servicios críticos ante cualquier acceso no autorizado.';

describe('Onboarding de la columna lateral de autenticación (86e3kz4du)', () => {
    it('reemplaza el placeholder por el copy informativo aprobado', () => {
        render(<MainLayoutAuth>formulario</MainLayoutAuth>);

        expect(screen.queryByText(/imagenes y informacion random/i)).not.toBeInTheDocument();
        expect(screen.getByText(BLOCK_1_TITLE)).toBeInTheDocument();
        expect(screen.getByText(BLOCK_1_DESC)).toBeInTheDocument();
        expect(screen.getByText(BLOCK_2_TITLE)).toBeInTheDocument();
        expect(screen.getByText(BLOCK_2_DESC)).toBeInTheDocument();
    });

    it('mantiene el bloque de diagnostico temporal al pie de la columna lateral', () => {
        render(<MainLayoutAuth>formulario</MainLayoutAuth>);

        expect(screen.getByTestId('infra-deploy-check')).toBeInTheDocument();
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
