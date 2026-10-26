// src/test/create-instance-notice.test.tsx
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import CreateNewInstances from '@/pages/createNewInstances';
import { PendingInstanceCreationsProvider } from '@/components/features/instances/context/PendingInstanceCreationsContext';

vi.mock('@/context/EventsContext', () => ({
    useEventsContext: () => ({ estado: 'open', ultimoMensaje: null, error: null, motivoCierre: null }),
}));

const ADVERTENCIA = /aprovisionamiento en desarrollo — próximamente en etapa 2/i;

function renderWizard() {
  return render(
    <PendingInstanceCreationsProvider>
      <MemoryRouter initialEntries={['/instances/new']}>
        <CreateNewInstances />
      </MemoryRouter>
    </PendingInstanceCreationsProvider>,
  );
}

describe('Advertencia de aprovisionamiento en desarrollo (/instances/new)', () => {
  it('muestra el banner role=alert al entrar directo, sin avanzar de paso', () => {
    renderWizard();

    expect(screen.getByRole('alert')).toHaveTextContent(ADVERTENCIA);
  });

  it('mantiene el banner en los pasos siguientes del asistente', async () => {
    const user = userEvent.setup();
    renderWizard();

    await user.click(screen.getByRole('button', { name: /siguiente/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(ADVERTENCIA);
  });
});
