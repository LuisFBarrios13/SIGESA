// src/constants/estudiantes.ts
import type { MatriculaListItem } from '../services/api';

// ── Constants ─────────────────────────────────────────────────

export const NOMBRES_GRADOS = [
  'Pre Jardín', 'Jardín', 'Transición',
  'Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto',
] as const;

export const ESTADO_COLOR: Record<string, string> = {
  ACTIVO:   'bg-emerald-100 text-emerald-800',
  RETIRADO: 'bg-red-100 text-red-800',
  GRADUADO: 'bg-blue-100 text-blue-800',
};

export const ESTADO_ICON: Record<string, string> = {
  ACTIVO:   'check_circle',
  RETIRADO: 'cancel',
  GRADUADO: 'school',
};

export const JORNADA_COLOR: Record<string, string> = {
  MAÑANA: 'bg-amber-100 text-amber-800',
  TARDE:  'bg-indigo-100 text-indigo-800',
};

// ── Helpers ───────────────────────────────────────────────────

export const getMatriculaActiva = (matriculas: MatriculaListItem[]): MatriculaListItem | undefined =>
  [...matriculas].sort((a, b) => b.year - a.year)[0];

/** Matrícula sobre la que se retira o reactiva: la del año en curso, o la más reciente. */
export const getMatriculaVigente = (matriculas: MatriculaListItem[]): MatriculaListItem | undefined =>
  matriculas.find((m) => m.year === new Date().getFullYear()) ?? getMatriculaActiva(matriculas);
