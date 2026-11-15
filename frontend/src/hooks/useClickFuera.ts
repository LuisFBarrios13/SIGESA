// src/hooks/useClickFuera.ts — cierra un menú al hacer clic fuera o al pulsar Escape.
import { useEffect, type RefObject } from 'react';

export function useClickFuera(ref: RefObject<HTMLElement | null>, abierto: boolean, cerrar: () => void) {
  useEffect(() => {
    if (!abierto) return;
    const alClic = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cerrar();
    };
    const alTecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrar();
    };
    document.addEventListener('mousedown', alClic);
    document.addEventListener('keydown', alTecla);
    return () => {
      document.removeEventListener('mousedown', alClic);
      document.removeEventListener('keydown', alTecla);
    };
  }, [ref, abierto, cerrar]);
}
