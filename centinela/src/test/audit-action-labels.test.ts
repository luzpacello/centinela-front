import { describe, expect, it } from 'vitest';
import { AUDIT_ACTION_LABELS, AUDIT_ACTION_OPTIONS, isAuditAction, auditActionLabel, auditStage, HIDDEN_AUDIT_ACTIONS } from '@/utils/auditActionLabels';

describe('etiquetas de auditoría', () => {
    it('coincide con el enum cerrado publicado por el backend', () => {
        const canonicalActions = [
            'LOGIN', 'LOGIN_FALLA', 'VERIFICAR_2FA', '2FA_FALLA', 'LOGOUT',
            'CREAR_USUARIO', 'ACTUALIZAR_USUARIO', 'ELIMINAR_USUARIO', 'ASIGNAR_PERMISOS',
            'RESETEAR_CONTRASENA', 'RESETEAR_TOTP', 'PASSWORD_CHANGED',
            'UPDATE_PROFILE_EMAIL_REQUESTED', 'UPDATE_PROFILE_EMAIL_CONFIRMED',
            'CREATE_INSTANCE', 'INICIAR_VM', 'DETENER_VM', 'APAGAR_VM', 'REINICIAR_VM',
            'REANUDAR_VM', 'ELIMINAR_VM', 'CONFIG_UPDATED', 'SNAPSHOT_CREATE',
            'SNAPSHOT_ROLLBACK', 'SNAPSHOT_DELETE', 'INSTANCE_PERMISSIONS_PURGED',
            'SYSTEM_INSTANCE_STOPPED_EXTERNALLY', 'ALERT_TRIGGERED', 'ALERT_RESOLVED',
            'EVENTOS_CONEXION', 'EVENTOS_CIERRE',
        ];
        expect(Object.keys(AUDIT_ACTION_LABELS).sort()).toEqual(canonicalActions.sort());
    });

    it('traduce las acciones de instancia al español', () => {
        expect(auditActionLabel('INICIAR_VM')).toBe('Instancia iniciada');
        expect(auditActionLabel('REINICIAR_VM')).toBe('Instancia reiniciada');
        expect(auditActionLabel('ELIMINAR_VM')).toBe('Instancia eliminada');
        expect(auditActionLabel('SNAPSHOT_CREATE')).toBe('Snapshot creado');
        expect(auditActionLabel('SNAPSHOT_DELETE')).toBe('Snapshot eliminado');
        expect(auditActionLabel('ALERT_TRIGGERED')).toBe('Alerta disparada');
        expect(auditActionLabel('SNAPSHOT_ROLLBACK')).toBe('Revertir snapshot');
        expect(auditActionLabel('CONFIG_UPDATED')).toBe('Configuración de instancia');
    });

    it('distingue el despacho del resultado final', () => {
        expect(auditStage('INICIAR_VM', 'PENDIENTE')).toBe('Inicio');
        expect(auditStage('INICIAR_VM', 'EXITO')).toBe('Resultado');
        expect(auditStage('INICIAR_VM', 'FALLA')).toBe('Resultado');
        expect(auditStage('LOGIN', 'EXITO')).toBeNull();
        expect(auditStage('INICIAR_VM', 'SUCCESS')).toBeNull();
        expect(auditStage('START', 'EXITO')).toBeNull();
    });

    it('incluye las acciones reales en el filtro y deja afuera el ruido de conexión', () => {
        const values = AUDIT_ACTION_OPTIONS.map((option) => option.value);

        expect(values).toContain('INICIAR_VM');
        expect(values).toContain('APAGAR_VM');
        expect(values).toContain('CREATE_INSTANCE');
        expect(values).toContain('PASSWORD_CHANGED');
        expect(values).toContain('UPDATE_PROFILE_EMAIL_REQUESTED');
        expect(values).toContain('UPDATE_PROFILE_EMAIL_CONFIRMED');
        expect(values).toContain('INSTANCE_PERMISSIONS_PURGED');
        expect(values).toContain('SYSTEM_INSTANCE_STOPPED_EXTERNALLY');
        expect(values).toContain('REANUDAR_VM');
        expect(values).toContain('SNAPSHOT_CREATE');
        expect(values).toContain('SNAPSHOT_ROLLBACK');
        expect(values).toContain('SNAPSHOT_DELETE');
        expect(values).toContain('ALERT_TRIGGERED');
        expect(values).toContain('CONFIG_UPDATED');
        for (const retired of ['CAMBIAR_CONTRASENA', 'START_VM', 'STOP_VM', 'EXPORTAR_AUDITORIA', 'SUSPENDER_VM', 'ACTUALIZAR_PERFIL', 'CONFIG_INSTANCE', 'CREATE_VM', 'CREATE_LXC', 'CREAR_VM', 'CREAR_LXC', 'START', 'STOP', 'SHUTDOWN', 'REBOOT']) {
            expect(isAuditAction(retired)).toBe(false);
        }
        expect(values).not.toContain('CONFIG_INSTANCE');
        expect(values).not.toContain('CREAR_INSTANCIA');
        expect(values).not.toContain('START');
        expect(new Set(values).size).toBe(values.length);
        expect(new Set(AUDIT_ACTION_OPTIONS.map((option) => option.label)).size).toBe(values.length);
        expect(Object.keys(AUDIT_ACTION_LABELS)).toHaveLength(31);
        expect([...values, ...HIDDEN_AUDIT_ACTIONS].sort()).toEqual(Object.keys(AUDIT_ACTION_LABELS).sort());
        for (const hidden of HIDDEN_AUDIT_ACTIONS) {
            expect(values).not.toContain(hidden);
        }
    });
});
