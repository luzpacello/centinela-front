export function getErrorMessage(error: any): string {
  const errorCode = 
    error?.response?.data?.errorCode || 
    error?.response?.errorCode || 
    error?.errorCode || 
    error?.message;

  switch (errorCode) {
    case 'INSTANCE_INVALID_STATE':
      return 'La acción no corresponde al estado actual de la instancia (por ejemplo, la máquina ya se encuentra encendida o apagada).';
    case 'INSTANCE_BUSY':
      return 'La instancia está ejecutando otra tarea en Proxmox. Por favor, espere a que finalice.';
    case 'INSTANCE_PROTECTED':
      return 'Esta instancia pertenece a la infraestructura crítica y no admite la acción solicitada.';
    case 'INSTANCE_ACCESS_DENIED':
      return 'No posee permisos operativos suficientes sobre esta instancia.';
    case 'PROXMOX_UNAVAILABLE':
      return 'El hipervisor Proxmox no se encuentra disponible. Compruebe la conectividad del host.';
    case 'PROXMOX_TIMEOUT':
      return 'Proxmox no respondió a tiempo. La acción pudo no haberse aplicado en el servidor.';
    default:
      return typeof error === 'string' ? error : (error?.message || 'Ocurrió un error inesperado al procesar la operación.');
  }
}