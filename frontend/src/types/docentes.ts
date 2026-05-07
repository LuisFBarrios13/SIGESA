// src/types/docentes.ts
// Tipos del dominio de docentes (API).
// Nota: src/types/docente.ts contiene tipos del panel de notas (UI), estos son distintos.

import type { JornadaEstudiante, JornadaDocente } from './shared';

export interface DocentePayload {
  cedula:      string;
  nombre:      string;
  telefono?:   string;
  correo?:     string;
  jornada:     JornadaDocente;
  nombreGrado: string;
}

export interface GradoAsignado {
  id_grado: number;
  nombre:   string;
  jornada:  JornadaEstudiante;
}

export interface DocenteResult {
  docente:         Record<string, unknown>;
  gradosAsignados: GradoAsignado[];
  credenciales: {
    username:         string;
    passwordTemporal: string;
    nota:             string;
  };
}

export interface DocenteListItem {
  cedula:    string;
  nombre:    string;
  telefono:  string | null;
  correo:    string | null;
  jornada:   JornadaDocente;
  grados:    GradoAsignado[];
}

export interface GradoDisponibilidad {
  id_grado: number;
  nombre:   string;
  jornada:  JornadaEstudiante;
  docente: {
    cedula:  string;
    nombre:  string;
    jornada: JornadaDocente;
  } | null;
}