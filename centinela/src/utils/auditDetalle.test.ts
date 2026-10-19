import { describe, expect, it } from 'vitest';
import { detalleCompleto, detalleCorto } from './auditDetalle';

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

    it('devuelve el texto tal cual', () => {
        expect(detalleCompleto('usuario@ejemplo.com')).toBe('usuario@ejemplo.com');
    });

    it('sin detalles devuelve undefined', () => {
        expect(detalleCompleto(null)).toBeUndefined();
    });
});
