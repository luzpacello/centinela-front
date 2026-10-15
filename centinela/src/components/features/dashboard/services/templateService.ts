import { apiClient } from '@/services/apiClient';

export interface TemplateResponse {
    id: string;
    name: string;
    type: 'ISO' | 'LXC_TEMPLATE';
    sizeBytes: number;
}

// Catálogo de imágenes ISO y plantillas LXC disponibles en el nodo.
// El endpoint requiere rol ADMIN.
export function getTemplates(signal?: AbortSignal): Promise<TemplateResponse[]> {
    return apiClient.get<TemplateResponse[]>('node/templates', { signal });
}
