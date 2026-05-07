// src/types/estudiantes.ts
// Tipos del dominio de estudiantes (API).

import type { JornadaEstudiante } from './shared';
import type { MatriculaListItem } from './matriculas';

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
  acudientes: {
    cedula:    string;
    nombre:    string;
    telefono:  string | null;
    correo:    string | null;
    RelacionEA: {
      parentesco:          string | null;
      acudiente_principal: boolean;
    };
  }[];
}

export interface ActualizarEstudiantePayload {
  nombre?:           string;
  fecha_nacimiento?: string;
  rh?:               string;
  direccion?:        string;
  observaciones?:    string;
}