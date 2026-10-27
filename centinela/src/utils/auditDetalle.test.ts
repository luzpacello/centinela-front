import { describe, expect, it } from 'vitest';
import { auditDetallesSeguros, detalleCompleto, detalleCorto } from './auditDetalle';

describe('detalleCorto', () => {
    it('usa el motivo del objeto cuando el movimiento no salió bien', () => {
        expect(detalleCorto({ razon: 'código TOTP incorrecto', sesion_id: '01a151e1' })).toBe('código TOTP incorrecto');
    });

    it('no inventa subtítulo cuando el objeto no trae nada legible', () => {
        expect(detalleCorto({ sesion_id: '01a151e1' })).toBeNull();
    });

    it('sigue mostrando el texto del contrato viejo', () => {
        expect(detalleCorto('usuario@ejemplo.com')).toBe('usuario@ejemplo.com');
    });

    it('no muestra crudo un JSON serializado como texto', () => {
        expect(detalleCorto('{"sesion_id":"01a151e1"}')).toBeNull();
    });

    it('sin detalles no hay subtítulo', () => {
        expect(detalleCorto(null)).toBeNull();
        expect(detalleCorto(undefined)).toBeNull();
    });
});

describe('detalleCompleto', () => {
    it('serializa el objeto para el tooltip', () => {
        expect(detalleCompleto({ tareaId: 'abc' })).toBe('{"tareaId":"abc"}');
    });

    describe('auditDetallesSeguros', () => {
        it('formatea JSON y oculta secretos incluso en objetos anidados', () => {
            const output = auditDetallesSeguros({
                upid: 'UPID:node:task',
                auth: { access_token: 'do-not-display' },
                nested: [{ password: 'also-secret', exitstatus: 'OK' }],
            });

            expect(output).toContain('"upid": "UPID:node:task"');
            expect(output).toContain('"exitstatus": "OK"');
            expect(output).not.toContain('do-not-display');
            expect(output).not.toContain('also-secret');
            expect(output.match(/\[REDACTADO\]/g)).toHaveLength(2);
        });

        it('tolera JSON serializado y texto inválido sin romper el renderizado', () => {
            expect(auditDetallesSeguros('{"api_key":"sensitive","status":"failed"}')).toContain('[REDACTADO]');
            expect(auditDetallesSeguros('password=hunter2')).toBe('password=[REDACTADO]');
            expect(auditDetallesSeguros('Authorization: Bearer token-value\nexitstatus: OK')).toBe(
                'Authorization: [REDACTADO]\nexitstatus: OK',
            );
            expect(auditDetallesSeguros('{not valid json')).toBe('{not valid json');
            expect(auditDetallesSeguros(null)).toBe('Sin detalles disponibles.');
        });
    });

    it('devuelve el texto tal cual', () => {
        expect(detalleCompleto('usuario@ejemplo.com')).toBe('usuario@ejemplo.com');
    });

    it('sin detalles devuelve undefined', () => {
        expect(detalleCompleto(null)).toBeUndefined();
    });
});
