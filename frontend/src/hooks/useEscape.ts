// src/hooks/useEscape.ts — cierra un diálogo o panel con la tecla Escape.
import { useEffect } from 'react';

export function useEscape(onCerrar: () => void) {
  useEffect(() => {
    const alTecla = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
    document.addEventListener('keydown', alTecla);
    return () => document.removeEventListener('keydown', alTecla);
  }, [onCerrar]);
}
