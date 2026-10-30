
import React from 'react';
import '@testing-library/jest-dom/vitest';

import {
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import fs from 'node:fs';
import path from 'node:path';

import { MemoryRouter } from 'react-router';

import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import InstancesPage from '@/pages/Instances';
import { Toaster } from '@/components/ui/toast';
import { PendingInstanceCreationsProvider } from '@/components/features/instances/context/PendingInstanceCreationsContext';

import { requestInstancePowerAction } from '@/components/features/instances/services/instanceService';
import type { InstanceRef } from '@/components/features/instances/types/instance';

// ============================================================
// Providers de la aplicación
// Misma configuración utilizada en instances-modals.test.tsx
// ============================================================

type ContextModule = Record<string, unknown>;

const contextModules = import.meta.glob<ContextModule>(
  '@/context/**/*.{ts,tsx,js,jsx}',
  { eager: true },
);

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };

  HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
});

const providers = Object.values(contextModules).flatMap((module) =>
  Object.entries(module)
    .filter(
      ([name, value]) =>
        /Provider$/.test(name) && typeof value === 'function',
    )
    .map(([name, value]) => ({
      name,
      Provider: value as React.ComponentType<{
        children?: React.ReactNode;
      }>,
    })),
);

function withProtectedProviders(
  children: React.ReactNode,
): React.ReactElement {
  return providers.reduceRight<React.ReactElement>(
    (inner, { Provider }) =>
      React.createElement(Provider, null, inner),
    React.createElement(React.Fragment, null, children),
  );
}

// ============================================================
// Datos de prueba
// ============================================================

const OPAQUE_ID = 'inst_k8Pq2v';

const opaqueInventory = [
  {
    id: OPAQUE_ID,
    name: 'api-gateway',
    type: 'lxc',
    node: 'nodo-principal',
    status: 'stopped',
    ip: null,
    cpuUsage: null,
    ramUsage: null,
    maxRam: null,
    nivelAcceso: 'FULL_ACCESS',
    activeTask: null,
  },
];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });

// ============================================================
// Renderizado
// ============================================================

function renderInstances() {
  window.sessionStorage.setItem(
    'centinela_access',
    'access-token-instancias',
  );

  window.localStorage.setItem(
    'centinela_user',
    JSON.stringify({
      id: 'user-test',
      organizacionId: 'org-1',
      nombreCompleto: 'Usuario de prueba',
      email: 'prueba@centinela.local',
      rol: 'ADMIN',
      instanciasPermitidas: [],
      permisos: [],
      tiene2FA: true,
    }),
  );

  return render(
    withProtectedProviders(
      <Toaster>
        <MemoryRouter initialEntries={['/instances']}>
          <PendingInstanceCreationsProvider>
            <InstancesPage />
          </PendingInstanceCreationsProvider>
        </MemoryRouter>
      </Toaster>,
    ),
  );
}

// ============================================================
// Backend simulado
// ============================================================

type FetchMock = ReturnType<typeof vi.fn>;

function stubOpaqueBackend(): FetchMock {
  const fetchMock = vi.fn().mockImplementation(
    (url: string, init: RequestInit = {}) => {
      const method = (init.method ?? 'GET').toUpperCase();

      if (
        method === 'GET' &&
        /\/instances(?:\?|$)/.test(String(url))
      ) {
        return Promise.resolve(json(opaqueInventory));
      }

      if (method === 'GET') {
        return Promise.resolve(json({}));
      }

      return Promise.resolve(
        json(
          {
            tareaId: 't-opaco-1',
          },
          202,
        ),
      );
    },
  );

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

// ============================================================
// Registro de órdenes HTTP
// ============================================================

function commands(fetchMock: FetchMock) {
  return (
    fetchMock.mock.calls as [string, RequestInit?][]
  ).filter(([url, init]) => {
    const method = (init?.method ?? 'GET').toUpperCase();

    return (
      /\/instances\//.test(String(url)) &&
      ['POST', 'DELETE', 'PUT', 'PATCH'].includes(method)
    );
  });
}

// ============================================================
// Helpers de tabla, acciones y modales
// ============================================================

const ACTIONS: Record<string, RegExp> = {
  start: /^(iniciar|encender|start)\b/i,
  shutdown: /^(apagar|apagado ordenado|shutdown)\b(?!.*forz)/i,
  stop: /^(detener|forzar|stop)\b|apagado forzado/i,
  reboot: /^(reiniciar|reboot)\b/i,
  delete: /^(eliminar|borrar|delete)\b/i,
};

async function rowOf(name: string): Promise<HTMLElement> {
  const cell = await screen.findByText(
    name,
    {},
    { timeout: 3000 },
  );

  const row = cell.closest('tr, [role="row"]');

  expect(
    row,
    `"${name}" no está dentro de una fila de tabla`,
  ).not.toBeNull();

  return row as HTMLElement;
}

function named(
  element: HTMLElement,
  pattern: RegExp,
): boolean {
  const name = (
    element.getAttribute('aria-label') ??
    element.textContent ??
    ''
  ).trim();

  return pattern.test(name);
}

async function actionsOf(
  row: HTMLElement,
): Promise<HTMLElement[]> {
  const user = userEvent.setup();

  const direct = within(row).queryAllByRole('button');

  const menuTrigger = direct.find(
    (button) =>
      button.getAttribute('aria-haspopup') ||
      named(button, /^(acciones|más|opciones)\b/i),
  );

  if (!menuTrigger) {
    return direct;
  }

  await user.click(menuTrigger);

  await waitFor(() => {
    expect(
      menuTrigger.getAttribute('aria-expanded'),
      'El menú de acciones no se abrió',
    ).toBe('true');
  });

  return [
    ...direct,
    ...screen.queryAllByRole('menuitem'),
  ];
}

async function requireAction(
  row: HTMLElement,
  action: string,
): Promise<HTMLElement> {
  const elements = await actionsOf(row);
  const pattern = ACTIONS[action];

  expect(
    pattern,
    `No existe un patrón configurado para la acción "${action}"`,
  ).toBeDefined();

  const actionElement = elements.find((element) =>
    named(element, pattern),
  );

  expect(
    actionElement,
    `La fila no ofrece la acción "${action}"`,
  ).toBeDefined();

  return actionElement!;
}

const queryDialog = () =>
  screen.queryByRole('dialog') ??
  screen.queryByRole('alertdialog');

async function findDialog(): Promise<HTMLElement> {
  return waitFor(
    () => {
      const dialog = queryDialog();

      expect(
        dialog,
        'No se abrió ningún modal de confirmación',
      ).not.toBeNull();

      return dialog as HTMLElement;
    },
    { timeout: 3000 },
  );
}

// ============================================================
// Configuración y limpieza
// ============================================================

afterEach(() => {
  vi.unstubAllGlobals();

  window.sessionStorage.clear();
  window.localStorage.clear();
});

// ============================================================
// FIX-108: identificadores opacos de instancias
// ============================================================

describe(
  'FIX-108 - identificadores de instancia ofuscados en el frontend',
  () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn());
    });

    it(
      'la tabla renderiza una instancia con ID opaco y la acción Iniciar utiliza el ID original',
      async () => {
        const fetchMock = stubOpaqueBackend();

        renderInstances();

        const row = await rowOf('api-gateway');
        const user = userEvent.setup();

        // Abrir el menú y seleccionar Iniciar.
        await user.click(
          await requireAction(row, 'start'),
        );

        // Esperar el modal de confirmación.
        const dialog = await findDialog();

        // La confirmación es la que debe enviar la petición.
        await user.click(
          within(dialog).getByRole('button', {
            name: /confirmar|iniciar|encender|aceptar/i,
          }),
        );

        await waitFor(() => {
          expect(commands(fetchMock)).toHaveLength(1);
        });

        const [url, init] = commands(fetchMock)[0];

        expect(String(url)).toContain(
          `/instances/${OPAQUE_ID}/start`,
        );

        expect(String(url)).not.toMatch(
          /NaN|undefined|null/,
        );

        expect(
          (init?.method ?? '').toUpperCase(),
        ).toBe('POST');
      },
      10000,
    );

    it(
      'el detalle de la fila enlaza con /instances/<ID opaco> sin convertirlo a número',
      async () => {
        stubOpaqueBackend();

        renderInstances();

        const row = await rowOf('api-gateway');

        const links = within(row).queryAllByRole('link');

        expect(
          links.length,
          'La fila no ofrece un enlace al detalle',
        ).toBeGreaterThan(0);

        const hrefs = links
          .map((link) => link.getAttribute('href'))
          .join(' ');

        expect(hrefs).toContain(
          `/instances/${OPAQUE_ID}`,
        );

        expect(hrefs).not.toMatch(
          /NaN|undefined|null/,
        );
      },
      10000,
    );

    it(
      'requestInstancePowerAction acepta el ID opaco y construye la URL exacta',
      async () => {
        window.sessionStorage.setItem(
          'centinela_access',
          'access-token-fix108',
        );

        const fetchMock = stubOpaqueBackend();

        await requestInstancePowerAction(
          OPAQUE_ID,
          'shutdown',
        );

        expect(commands(fetchMock)).toHaveLength(1);

        const [url] = commands(fetchMock)[0];

        expect(String(url)).toContain(
          `/instances/${OPAQUE_ID}/status/shutdown`,
        );
      },
    );

    it.each([
      ['path traversal', '../admin/users'],
      ['espacios internos', 'inst abc'],
      ['query string', 'inst_1?force=1'],
      ['separador de ruta', 'inst/1'],
      ['inyección con punto y coma', 'inst_1;rm'],
      ['cadena vacía', ''],
      ['salto de línea', 'inst_1\nX'],
      ['espacio inicial', ' inst_1'],
      ['espacio final', 'inst_1 '],
    ])(
      'rechaza identificadores con %s sin enviar la petición',
      async (_name, hostile) => {
        window.sessionStorage.setItem(
          'centinela_access',
          'access-token-fix108',
        );

        const fetchMock = stubOpaqueBackend();

        await expect(
          requestInstancePowerAction(
            hostile as InstanceRef,
            'start',
          ),
        ).rejects.toThrow();

        expect(commands(fetchMock)).toHaveLength(0);
      },
    );

    it(
      'mantiene la compatibilidad con VMID numéricos positivos',
      async () => {
        window.sessionStorage.setItem(
          'centinela_access',
          'access-token-fix108',
        );

        const fetchMock = stubOpaqueBackend();

        await requestInstancePowerAction(101, 'start');

        expect(commands(fetchMock)).toHaveLength(1);

        const [url] = commands(fetchMock)[0];

        expect(String(url)).toContain(
          '/instances/101/start',
        );
      },
    );

    it(
      'InstanceDetailPage y useInstances no convierten el ID con Number()/parseInt()',
      () => {
        const base = path.resolve(
          __dirname,
          '..',
        );

        const files = [
          'pages/InstanceDetailPage.tsx',
          'components/features/instances/hooks/useInstances.ts',
        ];

        for (const file of files) {
          const source = fs.readFileSync(
            path.join(base, file),
            'utf-8',
          );

          expect(
            source,
            `${file} convierte el identificador de instancia a número`,
          ).not.toMatch(
            /\b(?:parseInt|Number)\s*\(\s*(?:vmid|id|instanceId|params)\b/,
          );
        }
      },
    );
  },
);
