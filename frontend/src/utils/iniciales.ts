// src/utils/iniciales.ts
/** "Ana María Pérez" → "AM" (para los avatares). Ignora espacios repetidos. */
export const iniciales = (nombre: string): string =>
  nombre.trim().split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
