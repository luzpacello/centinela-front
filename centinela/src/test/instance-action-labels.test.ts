import { describe, expect, it } from 'vitest';
import { describeActionNoun, describeActionProgress, describeActionStatus } from '@/components/features/instances/utils/actionLabels';

describe('Etiquetas de acciones de instancia', () => {
    it('traduce los códigos de ciclo de vida al español', () => {
        expect(describeActionProgress('START')).toBe('Encendiendo…');
        expect(describeActionProgress('SHUTDOWN')).toBe('Apagando…');
        expect(describeActionProgress('REBOOT')).toBe('Reiniciando…');
        expect(describeActionProgress('SNAPSHOT_ROLLBACK')).toBe('Restaurando estado...');

        expect(describeActionNoun('START')).toBe('encendido');
        expect(describeActionNoun('SHUTDOWN')).toBe('apagado');
        expect(describeActionNoun('REBOOT')).toBe('reinicio');
        expect(describeActionNoun('DELETE')).toBe('eliminación');
        expect(describeActionNoun('SNAPSHOT_CREATE')).toBe('creación de snapshot');
        expect(describeActionStatus('REBOOT')).toBe('Operación en curso: reinicio');
    });

    it('nunca muestra el código técnico cuando no lo conoce', () => {
        expect(describeActionProgress('ACCION_DESCONOCIDA')).toBe('Operación en progreso…');
        expect(describeActionProgress(undefined)).toBe('Operación en progreso…');
        expect(describeActionNoun('ACCION_DESCONOCIDA')).toBe('la operación');
        expect(describeActionNoun(null)).toBe('la operación');
        expect(describeActionStatus('ACCION_DESCONOCIDA')).toBe('Operación en curso');
    });
});
