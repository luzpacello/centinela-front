// Traducciones en español de los códigos de acción que envía el backend por SSE
// y que usa la auditoría (START, STOP, SHUTDOWN, REBOOT, DELETE, SNAPSHOT_*).
// El usuario final nunca tiene que ver el código técnico: si llega uno
// desconocido se cae a un texto genérico, no al código crudo.
type ActionTranslation = {
    progress: string;
    noun: string;
};

const ACTION_TRANSLATIONS: Record<string, ActionTranslation> = {
    START: { progress: 'Encendiendo…', noun: 'encendido' },
    STOP: { progress: 'Apagando…', noun: 'detención' },
    SHUTDOWN: { progress: 'Apagando…', noun: 'apagado' },
    REBOOT: { progress: 'Reiniciando…', noun: 'reinicio' },
    DELETE: { progress: 'Eliminando…', noun: 'eliminación' },
    CREATE: { progress: 'Creando…', noun: 'creación' },
    CREATION: { progress: 'Creando…', noun: 'creación' },
    PROVISION: { progress: 'Creando…', noun: 'creación' },
    SNAPSHOT_CREATE: { progress: 'Creando Snapshot…', noun: 'creación de snapshot' },
    CREATE_SNAPSHOT: { progress: 'Creando Snapshot…', noun: 'creación de snapshot' },
    SNAPSHOTTING: { progress: 'Creando Snapshot…', noun: 'creación de snapshot' },
    SNAPSHOT_ROLLBACK: { progress: 'Restaurando estado...', noun: 'restauración del estado' },
    ROLLBACK_SNAPSHOT: { progress: 'Restaurando estado...', noun: 'restauración del estado' },
    ROLLBACK: { progress: 'Restaurando estado...', noun: 'restauración del estado' },
    ROLLING_BACK: { progress: 'Restaurando estado...', noun: 'restauración del estado' },
    DELETE_SNAPSHOT: { progress: 'Eliminando snapshot…', noun: 'eliminación del snapshot' },
};

function translate(action?: string | null): ActionTranslation | null {
    const code = (action ?? '').trim().toUpperCase();
    return code ? ACTION_TRANSLATIONS[code] ?? null : null;
}

// Texto para el estado en curso ("Encendiendo…", "Reiniciando…").
export function describeActionProgress(action?: string | null): string {
    return translate(action)?.progress ?? 'Operación en progreso…';
}

// Sustantivo para armar frases ("Operación de reinicio finalizada").
export function describeActionNoun(action?: string | null): string {
    return translate(action)?.noun ?? 'la operación';
}

// Frase completa para el estado en curso ("Operación en curso: reinicio").
export function describeActionStatus(action?: string | null): string {
    const translation = translate(action);
    return translation ? `Operación en curso: ${translation.noun}` : 'Operación en curso';
}
