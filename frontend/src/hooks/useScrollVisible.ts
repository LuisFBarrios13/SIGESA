// src/hooks/useScrollVisible.ts
// Muestra la barra de scroll de la página solo mientras la persona se desplaza
// (marca <html> con la clase "desplazando"; los colores están en index.css).
import { useEffect } from 'react';

const OCULTAR_TRAS_MS = 1000;

export function useScrollVisible() {
  useEffect(() => {
    const html = document.documentElement;
    let espera: ReturnType<typeof setTimeout> | undefined;
    const alDesplazar = () => {
      html.classList.add('desplazando');
      clearTimeout(espera);
      espera = setTimeout(() => html.classList.remove('desplazando'), OCULTAR_TRAS_MS);
    };
    window.addEventListener('scroll', alDesplazar, { passive: true });
    return () => {
      window.removeEventListener('scroll', alDesplazar);
      clearTimeout(espera);
      html.classList.remove('desplazando');
    };
  }, []);
}
