// src/layouts/escala.ts
import type { CSSProperties } from 'react';

/**
 * Tamaño de todo el contenido (barra superior y secciones), sin contar la barra lateral.
 * El valor vive en la variable CSS --p-escala (index.css): 0.85 en computador
 * (un 15 % más pequeño) y 1 en celular y tablet, donde el diseño ya viene a su medida.
 */
export const ESCALA_CONTENIDO = 'var(--p-escala)';

/** Id del contenedor donde se dibujan la ficha lateral y los diálogos (fuera del zoom). */
export const ID_CAPA = 'capa-panel';

/** Estilo para lo que va en la capa: mismo tamaño que el resto del contenido. */
export const zoomCapa: CSSProperties = { zoom: ESCALA_CONTENIDO };
