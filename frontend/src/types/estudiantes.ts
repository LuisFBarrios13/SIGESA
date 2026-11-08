// src/types/estudiantes.ts
import type { JornadaEstudiante }      from './shared';
import type { MatriculaListItem }      from './matriculas';
import type { AcudienteDetalle }       from './acudientes-admin';

export type { MatriculaListItem };

export interface GradoResumen {
  id_grado: number;
  nombre:   string;
  jornada:  JornadaEstudiante;
}

export interface EstudianteListItem {
  numero_identidad: string;
  nombre:           string;
  fecha_nacimiento: string;
  rh?:              string;
  direccion?:       string;
  observaciones?:   string;
  matriculas:       MatriculaListItem[];
}

export interface EstudianteDetalle extends EstudianteListItem {
  // Usa AcudienteDetalle para que coincida con el panel de edición
  acudientes: AcudienteDetalle[];
}

export interface ActualizarEstudiantePayload {
  nombre?:           string;
  fecha_nacimiento?: string;
  rh?:               string;
  direccion?:        string;
  observaciones?:    string;
}