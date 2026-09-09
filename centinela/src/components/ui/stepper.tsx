import React from 'react';
import { Check } from 'lucide-react';

interface StepperProps {
  /** Lista con los títulos de los pasos */
  steps: string[];
  /** Paso actual (base 1: el primer paso es 1) */
  currentStep: number;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {steps.map((stepTitle, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <React.Fragment key={index}>
              {/* Item del Paso */}
              <div className="flex flex-col items-center relative z-10">
                {/* Círculo indicador */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors duration-200 ${
                    isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : isCurrent
                      ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                      : 'bg-muted text-muted-foreground border-2 border-border'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <span>{stepNumber}</span>
                  )}
                </div>

                {/* Título del paso */}
                <span
                  className={`mt-2 text-xs font-medium text-center max-w-[100px] transition-colors duration-200 ${
                    isCurrent || isCompleted
                      ? 'text-foreground font-semibold'
                      : 'text-muted-foreground'
                  }`}
                >
                  {stepTitle}
                </span>
              </div>

              {/* Línea conectora entre pasos (no se renderiza en el último) */}
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-[2px] mx-2 -mt-6 transition-colors duration-200 ${
                    stepNumber < currentStep ? 'bg-primary' : 'bg-border'
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