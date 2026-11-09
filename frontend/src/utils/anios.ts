// src/utils/anios.ts
/** Opciones de año para los selectores: por defecto el anterior, el actual y los dos siguientes. */
export const opcionesAnio = (desde = -1, cantidad = 4) =>
  Array.from({ length: cantidad }, (_, i) => {
    const y = new Date().getFullYear() + desde + i;
    return { valor: y, texto: String(y) };
  });
