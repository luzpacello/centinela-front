// src/test/create-instance-notice.test.tsx
//
// El asistente de creación dejó de ser "próximamente": hoy expone los cinco pasos
// y llama a POST /instances. La advertencia de etapa 2 se retiró del código, así
// que este archivo pasa a fijar lo que la pantalla hace de verdad: abrir el
// asistente y no anunciar una postergación que ya no existe.
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import CreateNewInstances from '@/pages/createNewInstances';

function renderWizard() {
  return render(
    <MemoryRouter initialEntries={['/instances/new']}>
      <CreateNewInstances />
    </MemoryRouter>,
  );
}

describe('Asistente de creación de instancias (/instances/new)', () => {
  it('abre el asistente al entrar directo a la ruta', () => {
    renderWizard();

    expect(screen.getAllByText(/crear instancia/i).length).toBeGreaterThan(0);
  });

  it('no anuncia una postergación que ya no existe', () => {
    renderWizard();

    expect(screen.queryByText(/próximamente en etapa 2/i)).not.toBeInTheDocument();
  });
});
