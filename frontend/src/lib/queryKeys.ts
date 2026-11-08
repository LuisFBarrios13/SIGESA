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
  acudiente: {
    all:     ['acudiente'] as const,
    perfil:  ['acudiente', 'perfil'] as const,
    resumen: (id_matricula: number) => ['acudiente', 'resumen', id_matricula] as const,
  },
  grados: ['grados'] as const,
  estudiantes: {
    all:   ['estudiantes'] as const,
    lista: ['estudiantes', 'lista'] as const,
  },
  docentes: {
    all:            ['docentes'] as const,
    lista:          ['docentes', 'lista'] as const,
    disponibilidad: ['docentes', 'disponibilidad'] as const,
  },
  pagos: {
    all:     ['pagos'] as const,
    metodos: ['pagos', 'metodos'] as const,
    tarifa:  (year: number) => ['pagos', 'tarifa', year] as const,
    buscar:  (q: string, year: number) => ['pagos', 'buscar', q, year] as const,
    resumen: (id_matricula: number) => ['pagos', 'resumen', id_matricula] as const,
  },
  notas: {
    all: ['notas'] as const,
    // Los estudiantes del docente se comparten con Mi Grado (queryKeys.miGrado).
    porEstudiante: (id_matricula: number, periodo: number, year: number) =>
      ['notas', id_matricula, periodo, year] as const,
  },
  boletin: {
    all:   ['boletin'] as const,
    byMatricula: (id_matricula: number) => ['boletin', id_matricula] as const,
    detalle: (id_matricula: number, periodo: number, year: number) =>
      ['boletin', id_matricula, periodo, year] as const,
  },
};
