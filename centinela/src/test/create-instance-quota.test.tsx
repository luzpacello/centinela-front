import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createInstance } = vi.hoisted(() => ({ createInstance: vi.fn() }));

vi.mock('@/components/features/instances/services/instanceService', () => ({
    buildCreateInstancePayload: vi.fn(),
    createInstance,
    fetchCreationStorages: vi.fn().mockResolvedValue([{ value: 'local' }]),
    fetchCreationTemplates: vi.fn().mockResolvedValue([{ value: 'ubuntu', type: 'ISO' }]),
}));

vi.mock('@/components/features/instances/hooks/useCreationNodeStatus', () => ({
    useCreationNodeStatus: () => ({
        nodeStatus: {
            stale: false,
            allocatable: { maxCpuCores: 16, freeRamMb: 32768, freeStorageGb: 1000 },
        },
        nodeStatusError: null,
        isLoadingNodeStatus: false,
    }),
}));

vi.mock('@/context/EventsContext', () => ({
    useEventsContext: () => ({ ultimoMensaje: null }),
}));

import { PendingInstanceCreationsProvider } from '@/components/features/instances/context/PendingInstanceCreationsContext';
import { useCreateInstanceWizard } from '@/components/features/instances/hooks/useCreateInstanceWizard';
import { ApiRequestError } from '@/services/apiClient';

function WizardProbe() {
    const wizard = useCreateInstanceWizard();
    return (
        <div>
            <button type="button" onClick={() => {
                wizard.selectInstanceType('vm');
                wizard.updateField('nombre', 'instancia-conservada');
                wizard.updateField('cores', 2);
                wizard.updateField('ramMb', 4096);
                wizard.updateField('discoGb', 32);
                wizard.updateField('storageId', 'local');
                wizard.updateField('templateOso', 'ubuntu');
                wizard.setHasConfirmedConfiguration(true);
            }}>
                Preparar formulario
            </button>
            <button
                type="button"
                disabled={!wizard.canCreateInstance}
                onClick={() => void wizard.submitInstanceCreation()}
            >
                Crear instancia
            </button>
            <output>{wizard.draft.nombre}</output>
            {wizard.isCreatingInstance && <span>Enviando</span>}
            {wizard.submissionError && <div role="alert">{wizard.submissionError}</div>}
        </div>
    );
}

describe('manejo de cuota al crear una instancia', () => {
    beforeEach(() => {
        createInstance.mockReset();
    });

    it('mantiene el borrador y muestra el motivo exacto de la respuesta 409', async () => {
        const reason = 'Memoria RAM insuficiente: se requieren 4096 MB y quedan 1024 MB.';
        createInstance.mockRejectedValue(new ApiRequestError(reason, 409, 'RESOURCE_QUOTA_EXCEEDED'));
        render(
            <PendingInstanceCreationsProvider>
                <WizardProbe />
            </PendingInstanceCreationsProvider>,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Preparar formulario' }));
        const submitButton = await screen.findByRole('button', { name: 'Crear instancia' });
        await waitFor(() => expect(submitButton).toBeEnabled());
        fireEvent.click(submitButton);

        expect(await screen.findByRole('alert')).toHaveTextContent(reason);
        expect(screen.queryByText('Enviando')).not.toBeInTheDocument();
        expect(screen.getByText('instancia-conservada')).toBeInTheDocument();
        expect(createInstance).toHaveBeenCalledTimes(1);
    });
});
