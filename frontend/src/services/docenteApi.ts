// src/services/docenteApi.ts
import { api } from './api';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface GradoDocente {
  id_grado: number;
  nombre:   string;
  jornada:  'MAÑANA' | 'TARDE';
}

export interface DocentePerfil {
  cedula:   string;
  nombre:   string;
  telefono: string | null;
  correo:   string | null;
  jornada:  'MAÑANA' | 'TARDE' | 'COMPLETA';
  grados:   GradoDocente[];
}

export interface EstudianteResumen {
  numero_identidad: string;
  nombre:           string;
  fecha_nacimiento: string;
  rh?:              string;
  direccion?:       string;
  observaciones?:   string;
}

export interface MatriculaDocente {
  id_matricula: number;
  year:         number;
  jornada:      'MAÑANA' | 'TARDE';
  estado:       string;
  estudiante:   EstudianteResumen;
  grado:        GradoDocente;
}

export interface Materia {
  id_materia: number;
  nombre:     string;
  area?:      string;
}

/** Nota de una materia para un estudiante en un periodo */
export interface NotaEstudianteItem {
  id_materia:         number;
  nombre:             string;
  area:               string;
  /** Valor editable por periodo. Viene de la nota si fue modificado, sino del catálogo. */
  intensidad_horaria: number;
  nota:               number | null;
  /** Inasistencias en el periodo. Default 0. */
  fallas:             number;
  observacion:        string | null;
}

/** Respuesta de GET /notas/estudiante/:id */
export interface NotasEstudianteResponse {
  puesto:        number | null;
  observaciones: string;
  materias:      NotaEstudianteItem[];
}

export interface GuardarNotaEstudiantePayload {
  id_matricula:   number;
  numero_periodo: number;
  year:           number;
  materias: {
    id_materia:          number;
    nota:                number | '';
    fallas:              number;
    intensidad_horaria:  number | null;
  }[];
  puesto?:        number | null;
  observaciones?: string;
}

// ── API calls ──────────────────────────────────────────────────────────────────

export const docenteApi = {
  getPerfil: () =>
    api.get<DocentePerfil>('/docente/perfil'),

  getEstudiantes: (year?: number) =>
    api.get<MatriculaDocente[]>(
      `/docente/estudiantes${year ? `?year=${year}` : ''}`,
    ),

  getMaterias: () =>
    api.get<Materia[]>('/materias'),

  getNotasEstudiante: (id_matricula: number, numero_periodo: number, year: number) =>
    api.get<NotasEstudianteResponse>(
      `/notas/estudiante/${id_matricula}?numero_periodo=${numero_periodo}&year=${year}`,
    ),

  guardarNotasEstudiante: (payload: GuardarNotaEstudiantePayload) =>
    api.post('/notas/estudiante-bulk', payload),
};