// src/types/matriculas.ts
// Tipos del dominio de matrículas.

import type { JornadaEstudiante } from './shared';

export interface MatriculaPayload {
  estudiante: {
    numero_identidad: string;
    nombre:           string;
    fecha_nacimiento: string;
    rh?:              string;
    direccion?:       string;
    observaciones?:   string;
  };
  matricula: {
    id_grado:        number;
    year:            number;
    jornada:         JornadaEstudiante;
    fecha_matricula?: string;
  };
  acudiente: {
    cedula:    string;
    nombre:    string;
    telefono?: string;
    correo?:   string;
    direccion?: string;
  };
  relacion?: {
    parentesco?: string;
  };
}

export interface MatriculaResult {
  matricula:    Record<string, unknown>;
  estudiante:   Record<string, unknown>;
  acudiente:    Record<string, unknown>;
  credenciales: {
    username:         string;
    passwordTemporal: string;
    nota:             string;
  };
}

export interface MatriculaListItem {
  id_matricula:    number;
  year:            number;
  jornada:         JornadaEstudiante;
  fecha_matricula: string;
  estado:          'ACTIVO' | 'RETIRADO' | 'GRADUADO';
  grado?: {
    id_grado: number;
    nombre:   string;
    jornada:  JornadaEstudiante;
  };
}