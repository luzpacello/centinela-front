import { describe, expect, it, vi } from 'vitest';

vi.mock('@/services/apiClient', async () => {
    const actual = await vi.importActual<typeof import('@/services/apiClient')>('@/services/apiClient');
    return {
        ...actual,
        apiClient: {
            get: vi.fn(),
            post: vi.fn(),
            request: vi.fn(),
        },
    };
});

import { apiClient } from '@/services/apiClient';
import {
    createInstance,
    deleteInstance,
    requestInstancePowerAction,
} from '@/components/features/instances/services/instanceService';
import type { CreateInstancePayload } from '@/components/features/instances/types/createInstance';

const requestMock = vi.mocked(apiClient.request);
const postMock = vi.mocked(apiClient.post);

const payload: CreateInstancePayload = {
    cores: 2,
    descripcion: '',
    discoGb: 10,
    nodo: 'proxmox',
    nombre: 'contenedor-prueba',
    password: 'Clave-Segura1',
    ramMb: 1024,
    red: {
        bridge: 'vmbr0',
        firewall: false,
        gateway: '',
        ip: '',
        mascara: '',
        modo: 'dhcp',
        vlan: 0,
    },
    storageId: 'local-lvm',
    templateOso: 'local:vztmpl/debian-12.tar.zst',
    tipo: 'lxc',
};

describe('contrato de acciones de instancia', () => {
    it('usa el tareaId público que devuelve el backend al aceptar una orden', async () => {
        requestMock.mockResolvedValueOnce({ tareaId: 'tarea-201' });

        await expect(requestInstancePowerAction(201, 'start')).resolves.toEqual({ tareaId: 'tarea-201' });
        expect(requestMock).toHaveBeenCalledWith('/instances/201/start', {
            method: 'POST',
            expectedStatus: 202,
        });
    });

    it('rechaza una respuesta sin tareaId en vez de simular un seguimiento', async () => {
        requestMock.mockResolvedValueOnce({});

        await expect(requestInstancePowerAction(201, 'start')).rejects.toThrow(/Verificá el estado de la instancia/);
    });

    it('acepta el tareaId de una eliminación asíncrona', async () => {
        requestMock.mockResolvedValueOnce({ tareaId: 'tarea-borrado' });

        await expect(deleteInstance(201)).resolves.toEqual({ tareaId: 'tarea-borrado' });
        expect(requestMock).toHaveBeenCalledWith('/instances/201', {
            method: 'DELETE',
            expectedStatus: 202,
        });
    });

    it('acepta la creación con vmid y tareaId, sin exigir el UPID privado', async () => {
        postMock.mockResolvedValueOnce({ vmid: 201, tareaId: 'tarea-creacion' });

        await expect(createInstance(payload)).resolves.toEqual({ vmid: 201, tareaId: 'tarea-creacion' });
        expect(postMock).toHaveBeenCalledWith('/instances', payload, { expectedStatus: 202 });
    });

    it('rechaza una creación aceptada sin tareaId', async () => {
        postMock.mockResolvedValueOnce({ vmid: 201 });

        await expect(createInstance(payload)).rejects.toThrow(/La creación fue aceptada/);
    });
});
