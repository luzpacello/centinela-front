// Etiquetas y etapas comunes de la auditoría. La tabla y el filtro de la vista
// de Auditoría usan estas etiquetas en español; el detalle técnico conserva el
// código original que devuelve el backend.
export const AUDIT_ACTION_LABELS: Record<string, string> = {
    LOGIN: 'Inicio de sesión',
    LOGIN_FALLA: 'Inicio de sesión fallido',
    LOGOUT: 'Cierre de sesión',
    VERIFICAR_2FA: 'Verificación 2FA',
    '2FA_FALLA': 'Verificación 2FA fallida',
    START_VM: 'Instancia iniciada',
    STOP_VM: 'Instancia detenida',
    SNAPSHOT_CREATE: 'Snapshot creado',
    SNAPSHOT_ROLLBACK: 'Snapshot restaurado',
    SNAPSHOT_DELETE: 'Snapshot eliminado',
    CONFIG_UPDATED: 'Configuración de instancia',
    ALERT_TRIGGERED: 'Alerta disparada',
    ALERT_RESOLVED: 'Alerta resuelta',
    INSTANCE_PERMISSIONS_PURGED: 'Permisos de instancia depurados',
    UPDATE_PROFILE_EMAIL_REQUESTED: 'Cambio de correo solicitado',
    UPDATE_PROFILE_EMAIL_CONFIRMED: 'Cambio de correo confirmado',
    INICIAR_VM: 'Instancia iniciada',
    APAGAR_VM: 'Instancia apagada',
    DETENER_VM: 'Instancia detenida',
    REINICIAR_VM: 'Instancia reiniciada',
    ELIMINAR_VM: 'Instancia eliminada',
    // Códigos anteriores a la unificación de auditoría: se leen igual, pero no
    // se ofrecen en el filtro para no repetir opciones.
    START: 'Instancia iniciada',
    STOP: 'Instancia detenida',
    SHUTDOWN: 'Instancia apagada',
    REBOOT: 'Instancia reiniciada',
    CREAR_INSTANCIA: 'Instancia creada',
    CREATE_INSTANCE: 'Instancia creada',
    CREAR_VM: 'Máquina virtual creada',
    CREAR_LXC: 'Contenedor creado',
    CONFIG_INSTANCE: 'Configuración de instancia',    SUSPENDER_VM: 'Instancia suspendida',
    REANUDAR_VM: 'Instancia reanudada',
    CREAR_USUARIO: 'Usuario creado',
    ACTUALIZAR_USUARIO: 'Usuario actualizado',
    ELIMINAR_USUARIO: 'Usuario eliminado',
    ASIGNAR_PERMISOS: 'Permisos asignados',
    RESETEAR_CONTRASENA: 'Contraseña restablecida',
    RESETEAR_TOTP: '2FA restablecido',
    CAMBIAR_CONTRASENA: 'Contraseña actualizada',
    ACTUALIZAR_PERFIL: 'Perfil actualizado',
    EXPORTAR_AUDITORIA: 'Auditoría exportada',
};

// Acciones que no se muestran en la vista: son ruido de transporte del canal
// SSE y no movimientos de negocio. El detalle técnico sigue disponible para
// cualquier registro que ya exista en la base.
export const HIDDEN_AUDIT_ACTIONS = ['EVENTOS_CONEXION', 'EVENTOS_CIERRE'];

const AUDIT_ACTION_ORDER = [
    'INICIAR_VM',
    'APAGAR_VM',
    'DETENER_VM',
    'REINICIAR_VM',
    'ELIMINAR_VM',
    'CREATE_INSTANCE',
    'CONFIG_UPDATED',
    'SUSPENDER_VM',
    'REANUDAR_VM',
    'START_VM',
    'STOP_VM',
    'SNAPSHOT_CREATE',
    'SNAPSHOT_ROLLBACK',
    'SNAPSHOT_DELETE',
    'LOGIN',
    'LOGIN_FALLA',
    'LOGOUT',
    'VERIFICAR_2FA',
    '2FA_FALLA',
    'CAMBIAR_CONTRASENA',
    'CREAR_USUARIO',
    'ACTUALIZAR_USUARIO',
    'ELIMINAR_USUARIO',
    'ASIGNAR_PERMISOS',
    'RESETEAR_CONTRASENA',
    'RESETEAR_TOTP',
    'ACTUALIZAR_PERFIL',
    'EXPORTAR_AUDITORIA',
];

export const AUDIT_ACTION_OPTIONS = AUDIT_ACTION_ORDER.map((value) => ({
    value,
    label: AUDIT_ACTION_LABELS[value],
}));

export function auditActionLabel(accion?: string | null): string {
    const code = (accion ?? '').trim().toUpperCase();
    if (!code) return 'Actividad';
    if (AUDIT_ACTION_LABELS[code]) return AUDIT_ACTION_LABELS[code];
    const prettified = code.toLowerCase().replaceAll('_', ' ');
    return prettified.charAt(0).toUpperCase() + prettified.slice(1);
}

const PENDING_RESULTS = new Set(['PENDIENTE', 'PENDING']);
const FINAL_RESULTS = new Set(['SUCCESS', 'EXITO', 'FAILED', 'FALLO', 'FALLA', 'FALLIDO', 'ERROR', 'ADVERTENCIA', 'WARNING']);
const LIFECYCLE_ACTIONS = new Set([
    'INICIAR_VM', 'APAGAR_VM', 'DETENER_VM', 'REINICIAR_VM', 'ELIMINAR_VM',
    'CREAR_INSTANCIA', 'CREATE_INSTANCE', 'START_VM', 'STOP_VM', 'CREAR_VM', 'CREAR_LXC',
    'CONFIG_INSTANCE', 'SUSPENDER_VM', 'REANUDAR_VM',
    'START', 'STOP', 'SHUTDOWN', 'REBOOT',
]);

// Etapa del registro: el backend guarda un asiento de despacho (PENDIENTE) y
// otro de resultado final para las acciones de ciclo de vida. Las acciones sin
// ese par (login, usuarios, etc.) no llevan etiqueta de etapa.
export function auditStage(accion?: string | null, resultado?: string | null): 'Inicio' | 'Resultado' | null {
    const code = (accion ?? '').trim().toUpperCase();
    if (!LIFECYCLE_ACTIONS.has(code)) return null;
    const value = (resultado ?? '').trim().toUpperCase();
    if (PENDING_RESULTS.has(value)) return 'Inicio';
    if (FINAL_RESULTS.has(value)) return 'Resultado';
    return null;
}
