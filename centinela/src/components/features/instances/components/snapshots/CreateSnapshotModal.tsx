import { useState, useId } from 'react';
import { Camera, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
import { AuthenticationInputField } from '@/components/features/auth/components/AuthenticationInputField';
import { snapshotService, type CreateSnapshotResponse } from '../../services/snapshotService';
import { ApiRequestError } from '@/services/apiClient';

interface CreateSnapshotModalProps {
  instanceRef: string | number;
  isOpen: boolean;
  onClose: () => void;
  onSnapshotCreated: (res: CreateSnapshotResponse) => void;
}

// Regex según Swagger: Debe empezar con una letra, 2 a 40 caracteres alfanuméricos, "_" o "-".
const SNAPNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9_\-]{1,39}$/;

export function CreateSnapshotModal({
  instanceRef,
  isOpen,
  onClose,
  onSnapshotCreated,
}: CreateSnapshotModalProps) {
  const [snapname, setSnapname] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nameInputId = useId();
  const descInputId = useId();

  if (!isOpen) return null;

  const validateSnapname = (value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) {
      setNameError('El nombre del snapshot es obligatorio.');
      return false;
    }
    if (trimmed.toLowerCase() === 'current') {
      setNameError('El nombre "current" está reservado y no puede ser utilizado.');
      return false;
    }
    if (!SNAPNAME_REGEX.test(trimmed)) {
      setNameError('Debe comenzar con una letra y tener entre 2 y 40 caracteres alfanuméricos, "_" o "-".');
      return false;
    }
    setNameError(null);
    return true;
  };

  const handleSnapnameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSnapname(val);
    setApiError(null);
    if (val) {
      validateSnapname(val);
    } else {
      setNameError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateSnapname(snapname)) return;

    setIsSubmitting(true);
    try {
      const response = await snapshotService.createSnapshot(instanceRef, {
        snapname: snapname.trim(),
        description: description.trim() || undefined,
      });

      // Resetear campos y notificar al padre
      setSnapname('');
      setDescription('');
      setNameError(null);
      setIsSubmitting(false);
      onSnapshotCreated(response);
    } catch (err: unknown) {
      setIsSubmitting(false);
      if (err instanceof ApiRequestError) {
        setApiError(err.message || 'Error al solicitar la creación del snapshot.');
      } else if (err instanceof Error) {
        setApiError(err.message);
      } else {
        setApiError('Ocurrió un error inesperado. Intente nuevamente.');
      }
    }
  };

  const isSaveDisabled = isSubmitting || !snapname.trim() || Boolean(nameError);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-snapshot-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg space-y-4">
        {/* Cabecera */}
        <div className="flex items-center gap-3 border-b pb-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <Camera className="h-5 w-5" />
          </div>
          <div>
            <h2 id="create-snapshot-title" className="text-lg font-bold text-foreground">
              Crear Nuevo Snapshot
            </h2>
            <p className="text-xs text-muted-foreground">
              Instancia: {instanceRef}
            </p>
          </div>
        </div>

        {/* Alerta de Error HTTP 400 / 409 Conflict (INSTANCE_BUSY) */}
        {apiError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1 font-medium">{apiError}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FieldGroup className="space-y-3">
            {/* Campo Nombre del Snapshot */}
            <div>
              <AuthenticationInputField
                id={nameInputId}
                name="snapname"
                label="Nombre del snapshot"
                aria-label="Nombre del snapshot"
                type="text"
                placeholder="ej: Pre_Actualizacion_1"
                value={snapname}
                error={nameError ?? undefined}
                disabled={isSubmitting}
                onChange={handleSnapnameChange}
                onBlur={() => snapname && validateSnapname(snapname)}
                required
              />
            </div>

            {/* Campo Descripción */}
            <div className="space-y-1 text-left">
              <label
                htmlFor={descInputId}
                className="text-xs font-semibold text-foreground"
              >
                Descripción (Opcional)
              </label>
              <textarea
                id={descInputId}
                aria-label="Descripción del snapshot"
                rows={3}
                maxLength={255}
                placeholder="Explicación del punto de restauración..."
                value={description}
                disabled={isSubmitting}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border border-input bg-background p-2.5 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
            </div>
          </FieldGroup>

          {/* Botonera de acciones */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => {
                setSnapname('');
                setDescription('');
                setNameError(null);
                setApiError(null);
                onClose();
              }}
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={isSaveDisabled}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Guardar Snapshot'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}