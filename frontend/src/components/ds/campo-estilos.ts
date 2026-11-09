// src/components/ds/campo-estilos.ts
// Clases de los controles de formulario del diseño (fondo crema, esquinas de 14px).
const base =
  'w-full min-h-12 px-3.5 rounded-[14px] bg-crema text-[15px] text-tinta border border-transparent ' +
  'placeholder:text-tinta-suave focus:outline-none focus:bg-tarjeta focus:border-vino/40 focus:ring-2 focus:ring-vino/15 ' +
  'transition-colors disabled:opacity-60 disabled:cursor-not-allowed read-only:text-tinta-media';

export const claseInput  = base;
export const claseSelect = `${base} cursor-pointer`;
export const claseInputError = `${base} border-rojo/50 bg-rojo-suave/40`;
