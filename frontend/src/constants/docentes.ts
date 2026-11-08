// src/constants/docentes.ts
import type { JornadaDocente } from '../services/api';

export const NOMBRES_GRADOS = [
  'Pre Jardín', 'Jardín', 'Transición',
  'Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto',
] as const;

export type NombreGrado = typeof NOMBRES_GRADOS[number];

export const JORNADA_LABEL: Record<JornadaDocente, string> = {
  MAÑANA:   'Mañana',
  TARDE:    'Tarde',
  COMPLETA: 'Completa',
};

export const JORNADA_COLOR: Record<JornadaDocente, string> = {
  MAÑANA:   'bg-amber-100 text-amber-800',
  TARDE:    'bg-indigo-100 text-indigo-800',
  COMPLETA: 'bg-emerald-100 text-emerald-800',
};
