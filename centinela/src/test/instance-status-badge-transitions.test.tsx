import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InstanceStatusBadge } from '@/components/features/instances/components/InstanceBadges';

// El badge de estado es lo que el usuario mira para saber si la instancia
// terminó de apagarse o encenderse. Antes sólo cubría start/stop: un apagado
// ordenado (shutdown) o un reinicio seguían mostrando "Running" durante toda
// la operación, que es el síntoma reportado ("el apagado no se actualiza").
describe('Badge de estado durante una operación de energía', () => {
    it('muestra el apagado en curso cuando la acción pendiente es shutdown', () => {
        render(<InstanceStatusBadge status="running" pendingAction="shutdown" />);
        expect(screen.getByText('Apagando…')).toBeInTheDocument();
    });

    it('muestra el reinicio en curso', () => {
        render(<InstanceStatusBadge status="running" pendingAction="reboot" />);
        expect(screen.getByText('Reiniciando…')).toBeInTheDocument();
    });

    it('muestra el apagado en curso cuando viene del activeTask del inventario', () => {
        render(
            <InstanceStatusBadge
                status="running"
                activeTask={{ tareaId: 't1', action: 'SHUTDOWN', status: 'RUNNING' }}
            />,
        );
        expect(screen.getByText('Apagando…')).toBeInTheDocument();
    });

    it('vuelve al estado real cuando la operación termina', () => {
        render(<InstanceStatusBadge status="stopped" />);
        expect(screen.getByText('Stopped')).toBeInTheDocument();
    });
});
