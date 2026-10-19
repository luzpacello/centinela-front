// `detalles` de la auditoría es un objeto JSON desde RF-08: el backend lo expone
// como `json.RawMessage` con `swaggertype:"object"`. Antes viajaba como texto y el
// front lo cortaba con `trim()`, así que con un objeto el render se rompía. Estos
// helpers son el único lugar que conoce las dos formas, para que las pantallas no
// tengan que adivinar cuál les llegó.
export type AuditDetalles = Record<string, unknown> | string | null | undefined;

// Campos que explican un movimiento en una línea, para el subtítulo del panel.
const CLAVES_CORTAS = ['motivo', 'error', 'razon'];

// Texto de una línea para el panel de actividad, o null si no hay nada legible.
export function detalleCorto(detalles: AuditDetalles): string | null {
    if (typeof detalles === 'string') {
        const texto = detalles.trim();
        // Un JSON serializado como texto (contrato viejo) no se muestra crudo.
        return texto && !texto.startsWith('{') ? texto : null;
    }
    if (detalles && typeof detalles === 'object') {
        for (const clave of CLAVES_CORTAS) {
            const valor = detalles[clave];
            if (typeof valor === 'string' && valor.trim()) return valor.trim();
        }
    }
    return null;
}

// Todos los detalles en texto, para el tooltip de la vista de Auditoría.
export function detalleCompleto(detalles: AuditDetalles): string | undefined {
    if (typeof detalles === 'string') {
        return detalles.trim() || undefined;
    }
    if (detalles && typeof detalles === 'object') {
        return JSON.stringify(detalles);
    }
    return undefined;
}
