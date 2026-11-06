import React from 'react';

import '@testing-library/jest-dom/vitest';

import {
    render,
    screen,
    waitFor,
} from '@testing-library/react';

import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';

import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import CreateNewInstances from '@/pages/createNewInstances';

import {
    PendingInstanceCreationsProvider,
} from '@/components/features/instances/context/PendingInstanceCreationsContext';

import { parseTemplateOption } from '@/components/features/instances/data/createInstanceOptions';

import {
    formatTemplateDisplay,
} from '@/components/features/instances/components/InstanceCreationSummary';

// Providers de src/context.
type ContextModule = Record<string, unknown>;

const contextModules = import.meta.glob<ContextModule>(
    '@/context/**/*.{ts,tsx,js,jsx}',
    { eager: true },
);

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
    const orderedProviders = [...providers];

    orderedProviders.sort((a, b) => {
        if (/Auth/.test(a.name)) return -1;
        if (/Auth/.test(b.name)) return 1;

        if (/Event/.test(a.name)) return -1;
        if (/Event/.test(b.name)) return 1;

        if (/PendingInstanceCreations/.test(a.name)) return 1;
        if (/PendingInstanceCreations/.test(b.name)) return -1;

        return 0;
    });

    return orderedProviders.reduceRight<React.ReactElement>(
        (inner, { Provider }) =>
            React.createElement(Provider, null, inner),
        React.createElement(React.Fragment, null, children),
    );
}

const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
        },
    });

const GIB = 1024 ** 3;
const MIB = 1024 ** 2;

const pve8Storages = [
    {
        name: 'local-lvm',
        type: 'lvmthin',
        totalBytes: 250 * GIB,
        freeBytes: 200 * GIB,
        contentTypes: ['images', 'rootdir'],
    },
    {
        name: 'local',
        type: 'dir',
        totalBytes: 100 * GIB,
        freeBytes: 85 * GIB,
        contentTypes: ['iso', 'vztmpl'],
    },
];

const pve8Templates = [
    {
        id: 'local:vztmpl/debian-12-standard_12.2-1_amd64.tar.zst',
        name: 'debian-12-standard_12.2-1_amd64.tar.zst',
        type: 'LXC_TEMPLATE',
        sizeBytes: 125 * MIB,
    },
    {
        id: 'local:iso/debian-12.5.0-amd64-netinst.iso',
        name: 'debian-12.5.0-amd64-netinst.iso',
        type: 'ISO',
        sizeBytes: 650 * MIB,
    },
];

const nodeStatus = {
    cpu: { usagePercent: 15, cores: 8 },
    ram: { usedGb: 4, totalGb: 16, usagePercent: 25 },
    storage: { usedGb: 50, totalGb: 350, usagePercent: 14 },
    uptimeSeconds: 7200,
    allocatable: {
        maxCpuCores: 8,
        freeRamMb: 12288,
        freeStorageGb: 300,
        headroomPercent: 15,
    },
    instancesSummary: {
        vms: { running: 1, stopped: 0, paused: 0, total: 1 },
        lxc: { running: 2, stopped: 0, paused: 0, total: 2 },
    },
    stale: false,
    fetchedAt: '2026-10-27T10:00:00Z',
};

function setupPVE8Session() {
    window.sessionStorage.setItem(
        'centinela_access',
        'access-token-wizard-pve8',
    );

    window.localStorage.setItem(
        'centinela_user',
        JSON.stringify({
            id: 'user-admin',
            organizacionId: 'org-1',
            nombreCompleto: 'Admin Centinela',
            email: 'admin@centinela.local',
            rol: 'ADMIN',
            instanciasPermitidas: [],
            tiene2FA: true,
        }),
    );

    const fetchMock = vi.fn().mockImplementation(
        (url: string, init: RequestInit = {}) => {
            const target = String(url);

            if ((init.method ?? 'GET').toUpperCase() !== 'GET') {
                return Promise.resolve(
                    json(
                        {
                            vmid: '105',
                            tareaId: 'UPID:pve8:00001:create',
                        },
                        202,
                    ),
                );
            }

            if (/\/node\/status(\?|$)/.test(target)) {
                return Promise.resolve(json(nodeStatus));
            }

            if (/\/node\/storages(\?|$)/.test(target)) {
                return Promise.resolve(json(pve8Storages));
            }

            if (/\/node\/templates(\?|$)/.test(target)) {
                return Promise.resolve(json(pve8Templates));
            }

            if (/\/instances(\?|$)/.test(target)) {
                return Promise.resolve(json([]));
            }

            return Promise.resolve(json({}));
        },
    );

    vi.stubGlobal('fetch', fetchMock);

    return fetchMock;
}

describe('parseTemplateOption', () => {
    it.each([
        [
            'local:vztmpl/debian-11-standard_11.0-1_amd64.tar.zst',
            'Debian 11',
        ],
        [
            'local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst',
            'Debian 12',
        ],
        [
            'local:vztmpl/debian-13-standard_13.0-1_amd64.tar.zst',
            'Debian 13',
        ],
        [
            'local:vztmpl/ubuntu-24.04-standard_24.04-1_amd64.tar.zst',
            'Ubuntu 24.04',
        ],
        [
            'local:vztmpl/alpine-3.20-default_3.20-1_amd64.tar.zst',
            'Alpine 3.20',
        ],
    ])('identifica correctamente %s', (volid, expected) => {
        expect(parseTemplateOption(volid).displayName).toBe(expected);
    });

    it('extrae la arquitectura amd64', () => {
        const result = parseTemplateOption(
            'local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst',
        );

        expect(result.architecture).toBe('amd64');
    });

    it('identifica la variante standard', () => {
        const result = parseTemplateOption(
            'local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst',
        );

        expect(result.variant).toBe('Standard');
    });

    it('maneja identificadores desconocidos', () => {
        const result = parseTemplateOption(
            'local:vztmpl/custom-image.tar.zst',
        );

        expect(result.family).toBe('other');
        expect(result.version).toBe('');
    });
});

describe('formatTemplateDisplay', () => {
    it('formatea Debian 12 con su variante', () => {
        expect(
            formatTemplateDisplay(
                'local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst',
            ),
        ).toBe('Debian 12 (Standard)');
    });

    it('maneja identificadores vacíos', () => {
        expect(formatTemplateDisplay('')).toBe('—');
    });
});

describe('FRN-37 / ADP-07 - Wizard de creación Debian 12', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    it('permite seleccionar Debian 12 y llegar al resumen de creación', async () => {
        setupPVE8Session();

        const user = userEvent.setup();

        render(
            withProtectedProviders(
                <MemoryRouter>
                    <PendingInstanceCreationsProvider>
                        <CreateNewInstances />
                    </PendingInstanceCreationsProvider>
                </MemoryRouter>,
            ),
        );

        // Paso 1: Tipo y nombre.
        await user.click(
            await screen.findByRole('button', {
                name: /contenedor/i,
            }),
        );

        const nameInput = screen.getByLabelText(
            /nombre del contenedor/i,
        );

        await user.clear(nameInput);
        await user.type(nameInput, 'ct-debian12-test');

        await user.click(
            screen.getByRole('button', { name: /siguiente/i }),
        );

        // Paso 2: Recursos y almacenamiento.
        const storageSelect = await screen.findByRole('combobox', {
            name: /almacenamiento de destino/i,
        });

        await user.click(storageSelect);

        await user.click(
            await screen.findByRole('option', {
                name: /local-lvm/i,
            }),
        );

        const nextResources = screen.getByRole('button', {
            name: /siguiente/i,
        });

        await waitFor(() => {
            expect(nextResources).toBeEnabled();
        });

        await user.click(nextResources);

        // Paso 3: Red.
        await screen.findByRole('radiogroup', {
            name: /modo de asignación ipv4/i,
        });

        await user.click(
            screen.getByRole('radio', { name: /dhcp/i }),
        );

        const nextNetwork = screen.getByRole('button', {
            name: /siguiente/i,
        });

        await waitFor(() => {
            expect(nextNetwork).toBeEnabled();
        });

        await user.click(nextNetwork);

        // Paso 4: Sistema operativo.
        await screen.findByRole('radiogroup', {
            name: /template del sistema operativo/i,
        });

        const debian12Template = await screen.findByRole('radio', {
            name: /seleccionar debian 12, debian-12-standard/i,
        });

        await user.click(debian12Template);

        expect(debian12Template).toBeChecked();

        const nextTemplate = screen.getByRole('button', {
            name: /siguiente/i,
        });

        await waitFor(() => {
            expect(nextTemplate).toBeEnabled();
        });

        await user.click(nextTemplate);

        // Paso 5: Resumen.
        expect(
            await screen.findAllByText('Debian 12 (Standard)'),
        ).not.toHaveLength(0);

        expect(
            screen.getByText('amd64'),
        ).toBeInTheDocument();
    });
});