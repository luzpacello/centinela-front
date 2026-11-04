// Etiquetas y etapas comunes de la auditoría. La tabla y el filtro de la vista
// de Auditoría usan estas etiquetas en español; el detalle técnico conserva el
// código original que devuelve el backend.
export const AUDIT_ACTION_LABELS = {
    LOGIN: 'Inicio de sesión',
    LOGIN_FALLA: 'Inicio de sesión fallido',
    LOGOUT: 'Cierre de sesión',
    VERIFICAR_2FA: 'Verificación 2FA',
    '2FA_FALLA': 'Verificación 2FA fallida',
    SNAPSHOT_CREATE: 'Snapshot creado',
    SNAPSHOT_ROLLBACK: 'Revertir snapshot',
    SNAPSHOT_DELETE: 'Snapshot eliminado',
    CONFIG_UPDATED: 'Configuración de instancia',
    ALERT_TRIGGERED: 'Alerta disparada',
    ALERT_RESOLVED: 'Alerta resuelta',
    INSTANCE_PERMISSIONS_PURGED: 'Permisos de instancia depurados',
    SYSTEM_INSTANCE_STOPPED_EXTERNALLY: 'Instancia detenida externamente',
    UPDATE_PROFILE_EMAIL_REQUESTED: 'Cambio de correo solicitado',
    UPDATE_PROFILE_EMAIL_CONFIRMED: 'Cambio de correo confirmado',
    INICIAR_VM: 'Instancia iniciada',
    APAGAR_VM: 'Instancia apagada',
    DETENER_VM: 'Instancia detenida',
    REINICIAR_VM: 'Instancia reiniciada',
    ELIMINAR_VM: 'Instancia eliminada',
    CREATE_INSTANCE: 'Instancia creada',
    REANUDAR_VM: 'Instancia reanudada',
    CREAR_USUARIO: 'Usuario creado',
    ACTUALIZAR_USUARIO: 'Usuario actualizado',
    ELIMINAR_USUARIO: 'Usuario eliminado',
    ASIGNAR_PERMISOS: 'Permisos asignados',
    RESETEAR_CONTRASENA: 'Contraseña restablecida',
    RESETEAR_TOTP: '2FA restablecido',
    PASSWORD_CHANGED: 'Contraseña actualizada',
    EVENTOS_CONEXION: 'Conexión de eventos',
    EVENTOS_CIERRE: 'Cierre de eventos',
} as const;

export type AuditAction = keyof typeof AUDIT_ACTION_LABELS;

export function isAuditAction(action: string): action is AuditAction {
    return Object.hasOwn(AUDIT_ACTION_LABELS, action);
}

// Acciones que no se muestran en la vista: son ruido de transporte del canal
// SSE y no movimientos de negocio. El detalle técnico sigue disponible para
// cualquier registro que ya exista en la base.
export const HIDDEN_AUDIT_ACTIONS = ['EVENTOS_CONEXION', 'EVENTOS_CIERRE'];

// El selector se deriva del mismo catálogo para evitar omisiones y duplicados.
export const AUDIT_ACTION_OPTIONS = (Object.keys(AUDIT_ACTION_LABELS) as AuditAction[])
    .filter((value) => !HIDDEN_AUDIT_ACTIONS.includes(value))
    .map((value) => ({ value, label: AUDIT_ACTION_LABELS[value] }));

export function auditActionLabel(accion?: string | null): string {
    const code = (accion ?? '').trim().toUpperCase();
    if (!code) return 'Actividad';
    if (isAuditAction(code)) return AUDIT_ACTION_LABELS[code];
    const prettified = code.toLowerCase().replaceAll('_', ' ');
    return prettified.charAt(0).toUpperCase() + prettified.slice(1);
}

const LIFECYCLE_ACTIONS = new Set<AuditAction>([
    'INICIAR_VM', 'APAGAR_VM', 'DETENER_VM', 'REINICIAR_VM', 'ELIMINAR_VM',
    'CREATE_INSTANCE', 'CONFIG_UPDATED', 'REANUDAR_VM',
]);

// Etapa del registro: el backend guarda un asiento de despacho (PENDIENTE) y
// otro de resultado final para las acciones de ciclo de vida. Las acciones sin
// ese par (login, usuarios, etc.) no llevan etiqueta de etapa.
export function auditStage(accion?: string | null, resultado?: string | null): 'Inicio' | 'Resultado' | null {
    const code = (accion ?? '').trim().toUpperCase();
    if (!isAuditAction(code) || !LIFECYCLE_ACTIONS.has(code)) return null;
    const value = (resultado ?? '').trim().toUpperCase();
    if (value === 'PENDIENTE') return 'Inicio';
    if (value === 'EXITO' || value === 'FALLA') return 'Resultado';
    return null;
}
