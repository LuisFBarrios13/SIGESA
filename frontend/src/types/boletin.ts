// src/types/boletin.ts
// Tipos del dominio del boletín académico.
// Refleja exactamente la estructura que devuelve el backend.

export interface MateriaBoletin {
  id_materia:          number;
  nombre:              string;
  area:                string;
  intensidad_horaria:  number;
  fallas:              number;
  notas_periodos: {
    1: number | null;
    2: number | null;
    3: number | null;
    4: number | null;
  };
  nota_periodo_actual: number | null;
  promedio:            number | null;
  desempeño:           'SUPERIOR' | 'ALTO' | 'BÁSICO' | 'BAJO' | null;
}

export interface AreaBoletin {
  nombre:   string;
  materias: MateriaBoletin[];
}

export interface BoletinData {
  estudiante: {
    nombre:           string;
    numero_identidad: string;
  };
  grado: {
    nombre:  string;
    jornada: 'MAÑANA' | 'TARDE';
  };
  matricula: {
    id_matricula: number;
    year:         number;
  };
  directora:         string;
  periodo:           number;
  puesto:            number;
  total_estudiantes: number;
  promedio_general:  number;
  areas:             AreaBoletin[];
  observaciones:     string;
  generado_en:       string;
}