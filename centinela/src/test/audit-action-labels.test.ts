import { describe, expect, it } from 'vitest';
import { AUDIT_ACTION_OPTIONS, auditActionLabel, auditStage, HIDDEN_AUDIT_ACTIONS } from '@/utils/auditActionLabels';

describe('etiquetas de auditoría', () => {
    it('traduce las acciones de instancia al español', () => {
        expect(auditActionLabel('INICIAR_VM')).toBe('Instancia iniciada');
        expect(auditActionLabel('REINICIAR_VM')).toBe('Instancia reiniciada');
        expect(auditActionLabel('ELIMINAR_VM')).toBe('Instancia eliminada');
        expect(auditActionLabel('START')).toBe('Instancia iniciada');
        expect(auditActionLabel('SNAPSHOT_CREATE')).toBe('Snapshot creado');
    });

    it('distingue el despacho del resultado final', () => {
        expect(auditStage('INICIAR_VM', 'PENDIENTE')).toBe('Inicio');
        expect(auditStage('INICIAR_VM', 'SUCCESS')).toBe('Resultado');
        expect(auditStage('INICIAR_VM', 'FAILED')).toBe('Resultado');
        expect(auditStage('LOGIN', 'SUCCESS')).toBeNull();
    });

    it('incluye las acciones reales en el filtro y deja afuera el ruido de conexión', () => {
        const values = AUDIT_ACTION_OPTIONS.map((option) => option.value);

        expect(values).toContain('INICIAR_VM');
        expect(values).toContain('APAGAR_VM');
        expect(values).toContain('CREATE_INSTANCE');
        expect(values).toContain('START_VM');
        expect(values).toContain('STOP_VM');
        expect(values).toContain('SNAPSHOT_CREATE');
        expect(values).toContain('SNAPSHOT_ROLLBACK');
        expect(values).not.toContain('CREAR_INSTANCIA');
        expect(values).not.toContain('START');
        expect(new Set(values).size).toBe(values.length);
        for (const hidden of HIDDEN_AUDIT_ACTIONS) {
            expect(values).not.toContain(hidden);
        }
    });
});
