// src/types/grados.ts

export type JornadaGrado = 'MAÑANA' | 'TARDE';
export type JornadaDocente = 'MAÑANA' | 'TARDE' | 'COMPLETA';

export interface DocenteResumen {
  cedula: string;
  nombre: string;
  jornada: JornadaDocente;
}

export interface GradoConDocente {
  id_grado: number;
  nombre: string;
  jornada: JornadaGrado;
  id_docente: string | null;
  docente: DocenteResumen | null;
  tieneDocente: boolean;
}

export interface DocenteConDisponibilidad {
  cedula: string;
  nombre: string;
  jornada: JornadaDocente;
  disponible: boolean;
  jornadasOcupadas: JornadaGrado[];
  grados: { id_grado: number; nombre: string; jornada: JornadaGrado }[];
}

export interface AsignarDocentePayload {
  cedula_docente: string | null;
}