// src/constants/estudiantes.ts
import type { MatriculaListItem } from '../services/api';

// ── Constants ─────────────────────────────────────────────────

export const NOMBRES_GRADOS = [
  'Pre Jardín', 'Jardín', 'Transición',
  'Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto',
] as const;

// ── Helpers ───────────────────────────────────────────────────
// Un estudiante puede tener varias matrículas (una por año). Para que la lista
// de Estudiantes, Deudores y los botones de retirar/reactivar hablen de la
// misma, se muestra la del año en curso (o la más reciente si no tiene).

/** La matrícula del año más reciente (también la de un año futuro). */
export const getMatriculaReciente = (matriculas: MatriculaListItem[]): MatriculaListItem | undefined =>
  [...matriculas].sort((a, b) => b.year - a.year)[0];

/** La matrícula del año en curso, o la más reciente si no tiene. */
export const getMatriculaVigente = (matriculas: MatriculaListItem[]): MatriculaListItem | undefined =>
  matriculas.find((m) => m.year === new Date().getFullYear()) ?? getMatriculaReciente(matriculas);

/** La matrícula que se muestra: la del año filtrado, o la vigente. */
export const matriculaMostrada = (matriculas: MatriculaListItem[], year?: string): MatriculaListItem | undefined =>
  year ? matriculas.find((m) => String(m.year) === year) : getMatriculaVigente(matriculas);

/** Años posteriores al mostrado en los que también está matriculado. */
export const aniosPosteriores = (matriculas: MatriculaListItem[], mostrada?: MatriculaListItem): number[] =>
  mostrada ? matriculas.filter((m) => m.year > mostrada.year).map((m) => m.year).sort() : [];
