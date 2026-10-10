import '@testing-library/jest-dom/vitest';
import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    navigate: vi.fn(),
    toastAdd: vi.fn(),
}));

vi.mock('@/routes/router', () => ({
    applicationRouter: { navigate: mocks.navigate },
}));

vi.mock('@/components/ui/toast', () => ({
    toast: { add: mocks.toastAdd },
}));

import { ApiResponseNotifier } from '@/components/common/ApiResponseNotifier';
import { API_SESSION_EXPIRED_EVENT } from '@/services/apiClient';

describe('ApiResponseNotifier', () => {
    beforeEach(() => {
        window.sessionStorage.clear();
        mocks.navigate.mockReset();
        mocks.toastAdd.mockReset();
    });

    it('limpia la sesión y reemplaza la ruta por /login al recibir un 401', () => {
        window.sessionStorage.setItem('centinela_access', 'test-access-token');
        window.sessionStorage.setItem('centinela_refresh', 'test-refresh-token');
        window.sessionStorage.setItem('centinela_user', '{"id":1}');

        render(<ApiResponseNotifier />);
        fireEvent(
            window,
            new CustomEvent(API_SESSION_EXPIRED_EVENT, {
                detail: { status: 401, message: 'La sesión expiró.' },
            }),
        );

        expect(window.sessionStorage.getItem('centinela_access')).toBeNull();
        expect(window.sessionStorage.getItem('centinela_refresh')).toBeNull();
        expect(window.sessionStorage.getItem('centinela_user')).toBeNull();
        expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith('/login', { replace: true });
        expect(mocks.toastAdd).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Sesión vencida',
            description: 'La sesión expiró.',
        }));
    });
});