import React from 'react';
import { Check } from 'lucide-react';

/**
 * Propiedades para el componente Stepper.
 */
interface StepperProps {
  /**
   * Arreglo de strings que contiene los títulos/nombres descriptivos para cada uno de los pasos.
   * Ejemplo: `['Datos Personales', 'Verificación 2FA', 'Confirmación']`
   */
  steps: string[];

  /**
   * Índice (basado en 1) que indica cuál es el paso activo o actual en la interfaz.
   * Por ejemplo: `1` representa el primer paso, `2` el segundo, etc.
   */
  currentStep: number;
}

/**
 * Componente `Stepper`
 * 
 * Renderiza una barra de progreso por pasos (línea de tiempo horizontal) configurable y dinámica.
 * Muestra el estado visual de cada paso: completado (con check), activo (destacado) o pendiente (deshabilitado).
 * 
 * @param {StepperProps} props - Propiedades del componente.
 * @returns {JSX.Element} Elemento JSX que representa el indicador de pasos.
 */
export const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="w-full py-4">
      {/* Contenedor principal horizontal para alinear los ítems y las líneas conectoras */}
      <div className="flex items-center justify-between relative">
        {steps.map((stepTitle, index) => {
          // Calculamos el número de paso en base 1 para comparar con currentStep
          const stepNumber = index + 1;

          // Determinamos el estado del paso iterado
          const isCompleted = stepNumber < currentStep; // El paso ya fue superado
          const isCurrent = stepNumber === currentStep;   // Es el paso donde se encuentra el usuario

          return (
            <React.Fragment key={index}>
              {/* Contenedor individual de cada paso (Círculo + Título) */}
              <div className="flex flex-col items-center relative z-10">
                
                {/* Círculo indicador del paso */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors duration-200 ${
                    isCompleted
                      ? 'bg-blue-400 text-primary-foreground' // Estilo si ya está completado
                      : isCurrent
                      ? 'bg-blue-400 text-primary-foreground ring-4 ring-blue-400/20' // Estilo si es el paso actual (con anillo)
                      : 'bg-muted text-muted-foreground border-2 border-border' // Estilo si está pendiente
                  }`}
                >
                  {/* Si el paso está completado se muestra un icono de check; si no, el número correspondiente */}
                  {isCompleted ? (
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <span>{stepNumber}</span>
                  )}
                </div>

                {/* Etiqueta / Título descriptivo debajo del círculo */}
                <span
                  className={`mt-2 text-xs font-medium text-center max-w-[100px] transition-colors duration-200 ${
                    isCurrent || isCompleted
                      ? 'text-blue-500 font-semibold' // Texto destacado si el paso está activo o superado
                      : 'text-muted-foreground' // Texto atenuado si aún no se llega a este paso
                  }`}
                >
                  {stepTitle}
                </span>
              </div>

              {/* 
                Línea conectora entre pasos.
                Se renderiza únicamente si NO es el último paso de la lista (index < steps.length - 1).
              */}
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-[2px] mx-2 -mt-6 transition-colors duration-200 ${
                    // Si el paso iterado es menor al paso actual, la línea conectora se pinta con el color activo
                    stepNumber < currentStep ? 'bg-blue-200' : 'bg-border'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};