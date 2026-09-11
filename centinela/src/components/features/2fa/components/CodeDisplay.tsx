import React from 'react';

interface CodeDisplayProps {
  code: string;
}

export const CodeDisplay: React.FC<CodeDisplayProps> = ({ code }) => {
  // Inserta un espacio cada 4 caracteres
  const formattedCode = code.match(/.{1,4}/g)?.join(' ') || code;

  return (
    <div className="flex-1 h-10 px-3 flex items-center justify-center bg-muted/50 border border-input rounded-md text-foreground font-mono font-semibold text-center select-all opacity-80 cursor-not-allowed shadow-xs">
        {formattedCode}
    </div>
  );
};