import React from 'react';
import '@testing-library/jest-dom/vitest';
import {
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import InstancesPage from '@/pages/Instances';
import { Toaster } from '@/components/ui/toast';
import { PendingInstanceCreationsProvider } from '@/components/features/instances/context/PendingInstanceCreationsContext';

// ============================================================
// Providers de la aplicación
// Reemplaza la dependencia de app-providers.ts.
// ============================================================

type ContextModule = Record<string, unknown>;

const contextModules = import.meta.glob<ContextModule>(
  '@/context/**/*.{ts,tsx,js,jsx}',
  { eager: true },
);

// Polyfill para que JSDOM reconozca los métodos del HTMLDialogElement
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
// Datos y tipos de prueba
// ============================================================

type Instance = {
  id: number;
  name: string;
  type: 'vm' | 'lxc';
  node: string;
  status: string;
  ip: string | null;
  cpuUsage: number | null;
  ramUsage: number | null;
  maxRam: number | null;
  nivelAcceso: string;
  activeTask: null;
};

type Session = {
  rol: 'ADMIN' | 'OPERATOR';
  permisos?: {
    vmid: number;
    nivelAcceso: 'FULL_ACCESS' | 'READ_ONLY';
  }[];
};

type Action = 'start' | 'shutdown' | 'stop' | 'reboot' | 'delete';
type FetchMock = ReturnType<typeof vi.fn>;

const inventory: Instance[] = [
  {
    id: 101,
    name: 'servidor-web',
    type: 'vm',
    node: 'pve',
    status: 'running',
    ip: '192.168.1.50',
    cpuUsage: 25,
    ramUsage: 4294967296,
    maxRam: 17179869184,
    nivelAcceso: 'FULL_ACCESS',
    activeTask: null,
  },
  {
    id: 102,
    name: 'base-datos',
    type: 'lxc',
    node: 'pve',
    status: 'stopped',
    ip: null,
    cpuUsage: null,
    ramUsage: null,
    maxRam: null,
    nivelAcceso: 'READ_ONLY',
    activeTask: null,
  },
];

const ACTIONS: Record<Action, RegExp> = {
  start: /^(iniciar|encender|start)\b/i,
  shutdown: /^(apagar|apagado ordenado|shutdown)\b(?!.*forz)/i,
  stop: /^(detener|forzar|stop)\b|apagado forzado/i,
  reboot: /^(reiniciar|reboot)\b/i,
  delete: /^(eliminar|borrar|delete)\b/i,
};

// ============================================================
// Renderizado
// ============================================================

function renderInstances({ rol, permisos = [] }: Session) {
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
      rol,
      instanciasPermitidas: permisos.map((p) => p.vmid),
      permisos,
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
// Fetch simulado y registro de órdenes
// ============================================================

function stubFetch(
  onCommand: (url: string, init: RequestInit) => Promise<Response>,
): FetchMock {
  const fetchMock = vi.fn().mockImplementation(
    (url: string, init: RequestInit = {}) => {
      const method = (init.method ?? 'GET').toUpperCase();

      if (
        method === 'GET' &&
        /\/instances(\?|$)/.test(String(url))
      ) {
        return Promise.resolve(
          new Response(JSON.stringify(inventory), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          }),
        );
      }

      if (method === 'GET') {
        return Promise.resolve(
          new Response('{}', {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          }),
        );
      }

      return onCommand(String(url), init);
    },
  );

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

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

function named(element: HTMLElement, pattern: RegExp): boolean {
  const name = (
    element.getAttribute('aria-label') ??
    element.textContent ??
    ''
  ).trim();

  return pattern.test(name);
}

async function actionsOf(row: HTMLElement): Promise<HTMLElement[]> {
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

  // Un OPERATOR sobre una instancia READ_ONLY abre un menú sin opciones: hay que
  // esperar la apertura del menú, no una cantidad mínima de ítems.
  await waitFor(() => {
    expect(
      menuTrigger.getAttribute('aria-expanded'),
      'El menú de acciones no se abrió',
    ).toBe('true');
  });

  return [...direct, ...screen.queryAllByRole('menuitem')];
}

async function findAction(
  row: HTMLElement,
  action: Action,
): Promise<HTMLElement | undefined> {
  const elements = await actionsOf(row);

  return elements.find((element) =>
    named(element, ACTIONS[action]),
  );
}

async function requireAction(
  row: HTMLElement,
  action: Action,
): Promise<HTMLElement> {
  const element = await findAction(row, action);

  expect(
    element,
    `La fila no ofrece la acción "${action}"`,
  ).toBeDefined();

  return element!;
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
// Configuración de los tests
// ============================================================

let fetchMock: FetchMock;

beforeEach(() => {
  fetchMock = stubFetch(() =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          tareaId: 't-1',
        }),
        {
          status: 202,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    ),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.sessionStorage.clear();
  window.localStorage.clear();
});

// Abre el modal y verifica que aún no se envió ninguna orden.
async function openAndCancel(
  name: string,
  action: Action,
) {
  const user = userEvent.setup();
  const row = await rowOf(name);

  await user.click(await requireAction(row, action));

  const dialog = await findDialog();

  expect(
    commands(fetchMock),
    `"${action}" envió la orden antes de confirmar el modal`,
  ).toHaveLength(0);

  return { user, dialog };
}

async function cancel(
  user: ReturnType<typeof userEvent.setup>,
  dialog: HTMLElement,
) {
  await user.click(
    within(dialog).getByRole('button', {
      name: /cancelar|volver|cerrar/i,
    }),
  );

  await waitFor(() => {
    expect(queryDialog()).toBeNull();
  });

  expect(
    commands(fetchMock),
    'Cancelar el modal envió una petición',
  ).toHaveLength(0);
}

// ============================================================
// FRN-15: modales de confirmación antierror
// ============================================================

describe(
  'FRN-15 - Modales de confirmación antierror para acciones operativas',
  () => {
    it('no deja rastros de depuración al renderizar las acciones', async () => {
      const log = vi.spyOn(console, 'log').mockImplementation(() => {});

      try {
        renderInstances({ rol: 'ADMIN' });
        await rowOf('servidor-web');

        expect(log.mock.calls.some(([mensaje]) => String(mensaje).includes('InstanceAction DEBUG'))).toBe(false);
      } finally {
        log.mockRestore();
      }
    });

    it(
      'Start pide confirmación y cancelar no envía ninguna petición',
      async () => {
        renderInstances({ rol: 'ADMIN' });

        const { user, dialog } = await openAndCancel(
          'base-datos',
          'start',
        );

        expect(
          within(dialog).getByRole('button', {
            name: /confirmar|iniciar|encender|aceptar/i,
          }),
        ).toBeInTheDocument();

        await cancel(user, dialog);
      },
      10000,
    );

    it.each(['shutdown', 'reboot'] as const)(
      '%s advierte sobre el apagado o reinicio del sistema operativo huésped',
      async (action) => {
        renderInstances({ rol: 'ADMIN' });

        const { user, dialog } = await openAndCancel(
          'servidor-web',
          action,
        );

        expect(dialog.textContent).toMatch(
          /sistema operativo|hu[eé]sped|guest/i,
        );

        await cancel(user, dialog);
      },
    );

    it(
      'Stop advierte en rojo sobre la posible pérdida de datos y cancelar no envía nada',
      async () => {
        renderInstances({ rol: 'ADMIN' });

        const { user, dialog } = await openAndCancel(
          'servidor-web',
          'stop',
        );

        expect(dialog.textContent).toMatch(
          /p[eé]rdida de datos|perder (los )?datos|datos no guardados/i,
        );

        const red = [
          dialog,
          ...Array.from(
            dialog.querySelectorAll<HTMLElement>('*'),
          ),
        ].some((element) => {
          const className = element.getAttribute('class') ?? '';
          const style = element.getAttribute('style') ?? '';

          return (
            /(^|\s|:)(text|bg|border)-(red|rose)-\d|destructive|danger/i.test(
              className,
            ) ||
            /color:\s*(red|#(?:dc2626|ef4444|b91c1c|f87171)|rgb\((?:220,\s*38,\s*38|239,\s*68,\s*68)\))/i.test(
              style,
            )
          );
        });

        expect(
          red,
          'La advertencia de Stop no tiene un estilo rojo',
        ).toBe(true);

        await cancel(user, dialog);
      },
    );

    it(
      'Delete requiere escribir el ID o el nombre; cancelar no envía peticiones',
      async () => {
        renderInstances({ rol: 'ADMIN' });

        const { user, dialog } = await openAndCancel(
          'base-datos',
          'delete',
        );

        const input = within(dialog).getByRole('textbox');

        const confirm = within(dialog).getByRole('button', {
          name: /eliminar|borrar|confirmar/i,
        });

        expect(
          confirm,
          'El botón de confirmar Delete debe comenzar deshabilitado',
        ).toBeDisabled();

        await user.type(input, 'otra-cosa');

        expect(
          confirm,
          'Un texto incorrecto habilitó el borrado',
        ).toBeDisabled();

        await user.clear(input);
        await user.type(input, 'base-datos');

        if ((confirm as HTMLButtonElement).disabled) {
          await user.clear(input);
          await user.type(input, '102');
        }

        expect(
          confirm,
          'Ni el nombre ni el ID habilitaron el borrado',
        ).toBeEnabled();

        expect(
          commands(fetchMock),
          'Escribir la confirmación envió una orden sin pulsar el botón',
        ).toHaveLength(0);

        await cancel(user, dialog);
      },
    );

    it(
      'OPERATOR ve acciones de energía solo con FULL_ACCESS y nunca ve Delete',
      async () => {
        renderInstances({
          rol: 'OPERATOR',
          permisos: [
            {
              vmid: 101,
              nivelAcceso: 'FULL_ACCESS',
            },
            {
              vmid: 102,
              nivelAcceso: 'READ_ONLY',
            },
          ],
        });

        const energy = [
          ACTIONS.start,
          ACTIONS.shutdown,
          ACTIONS.stop,
          ACTIONS.reboot,
        ];

        const isEnergy = (element: HTMLElement) =>
          energy.some((pattern) =>
            pattern.test(
              (
                element.getAttribute('aria-label') ??
                element.textContent ??
                ''
              ).trim(),
            ),
          );

        const full = await actionsOf(
          await rowOf('servidor-web'),
        );

        expect(
          full.filter(isEnergy).length,
          'FULL_ACCESS debe permitir acciones de energía',
        ).toBeGreaterThan(0);

        expect(
          full
            .filter(isEnergy)
            .every(
              (element) =>
                !(element as HTMLButtonElement).disabled,
            ),
          'Las acciones con FULL_ACCESS no deben estar deshabilitadas',
        ).toBe(true);

        const readOnly = await actionsOf(
          await rowOf('base-datos'),
        );

        expect(
          readOnly.filter(isEnergy),
          'READ_ONLY no debe mostrar acciones de energía',
        ).toHaveLength(0);

        for (const name of [
          'servidor-web',
          'base-datos',
        ]) {
          expect(
            await findAction(await rowOf(name), 'delete'),
            `El OPERATOR ve Delete en ${name}`,
          ).toBeUndefined();
        }
      },
    );
  },
);

// ============================================================
// Accesibilidad de las acciones (1dfdzjea35b)
// ============================================================

describe('Accesibilidad de las acciones de instancia', () => {
  it(
    'nombra cada acción con aria-label canónico y no expone el atributo arial-label',
    async () => {
      renderInstances({ rol: 'ADMIN' });

      await actionsOf(await rowOf('servidor-web'));

      expect(
        document.querySelector('[arial-label]'),
        'El DOM expone el atributo tipografiado arial-label',
      ).toBeNull();

      for (const item of screen.getAllByRole('menuitem')) {
        expect(
          item.getAttribute('aria-label'),
          'Un ítem del menú no declara aria-label',
        ).toMatch(/^(iniciar|encender|apagar|detener|reiniciar|eliminar)\b/i);

        const nombreAccesible = item.getAttribute('aria-label') ?? '';
        const textoVisible = item.textContent?.trim() ?? '';

        expect(
          nombreAccesible.toLowerCase(),
          `El nombre accesible "${nombreAccesible}" no contiene el texto visible "${textoVisible}"`,
        ).toContain(textoVisible.toLowerCase());
      }

      expect(
        screen.getByRole('menuitem', { name: /^apagar$/i }),
      ).toBeInTheDocument();

      expect(
        screen.getByRole('menuitem', { name: /^reiniciar$/i }),
      ).toBeInTheDocument();

      expect(
        screen.getByRole('menuitem', { name: /^detener$/i }),
      ).toBeInTheDocument();

      expect(
        screen.getByRole('menuitem', { name: /^eliminar$/i }),
      ).toBeInTheDocument();
    },
  );
});