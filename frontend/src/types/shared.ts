// src/types/shared.ts
// Tipos compartidos entre varios dominios del sistema.

export type JornadaEstudiante = 'MAÑANA' | 'TARDE';
export type JornadaDocente    = 'MAÑANA' | 'TARDE' | 'COMPLETA';

/** Grado tal como lo devuelve GET /api/grados */
export interface Grado {
  id_grado: number;
  nombre:   string;
  jornada:  JornadaEstudiante;
  docente?: {
    cedula:  string;
    nombre:  string;
    jornada: JornadaDocente;
  } | null;
}

/** Respuesta del endpoint de login */
export interface LoginResult {
  token: string;
  user:  import('./auth').AuthUser;
}