// src/lib/queryKeys.ts
// Claves de caché de TanStack Query, en un solo lugar.
// Cada clave identifica un conjunto de datos; invalidar la clave "padre"
// (p. ej. queryKeys.dashboard.all) invalida todas sus variantes por año.

export const queryKeys = {
  deudores: {
    all:    ['deudores'] as const,
    byYear: (year: number) => ['deudores', year] as const,
  },
  dashboard: {
    all:    ['dashboard'] as const,
    byYear: (year: number) => ['dashboard', year] as const,
  },
  miGrado: {
    all:    ['mi-grado'] as const,
    perfil: ['mi-grado', 'perfil'] as const,
    estudiantes: (year: number) => ['mi-grado', 'estudiantes', year] as const,
  },
  boletin: {
    all:   ['boletin'] as const,
    byMatricula: (id_matricula: number) => ['boletin', id_matricula] as const,
    detalle: (id_matricula: number, periodo: number, year: number) =>
      ['boletin', id_matricula, periodo, year] as const,
  },
};
