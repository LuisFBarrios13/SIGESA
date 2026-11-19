// src/types/docentes.ts — docentes vistos por el administrador.

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

/**
 * Datos personales editables de un docente. La cédula no se cambia;
 * el grado y la jornada se cambian aparte (docentesApi.cambiarAsignacion / intercambiar).
 */
export interface ActualizarDocentePayload {
  nombre?:   string;
  telefono?: string;
  correo?:   string;
}