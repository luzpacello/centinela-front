import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

interface CopySecretProps {
  code: string;
}

export const CopySecretSection: React.FC<CopySecretProps> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      // Restablece el estado del botón después de 2 segundos
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar al portapapeles', err);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between">
        
        {/* Botón de copiado */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleCopy}
          className="h-8 gap-1 text-xs"
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-600" />
              <span>¡Copiado!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copiar clave</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};