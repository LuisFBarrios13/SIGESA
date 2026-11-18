// src/types/matriculas.ts
// Tipos del dominio de matrículas.

import type { JornadaEstudiante } from './shared';
import type { Sexo, TipoDocumento } from './estudiantes';

export interface MatriculaPayload {
  estudiante: {
    numero_identidad: string;
    nombre:           string;
    fecha_nacimiento: string;
    tipo_documento?:  TipoDocumento;
    sexo?:            Sexo;
    rh?:              string;
    eps?:             string;
    direccion?:       string;
    observaciones?:   string;
  };
  matricula: {
    id_grado:        number;
    /** Solo el año en curso o el siguiente. */
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
    telefono_trabajo?:  string;
    direccion_trabajo?: string;
  };
  relacion?: {
    parentesco?: string;
  };
}

export interface MatriculaResult {
  matricula:    Record<string, unknown>;
  estudiante:   Record<string, unknown>;
  acudiente:    Record<string, unknown>;
  acudienteNuevo: boolean;
  credenciales: {
    username:         string | null;
    passwordTemporal: string | null;
    nota:             string;
  };
}

/** PROMOCION: matriculado en diciembre para el año siguiente. FINALIZADO: su año ya terminó. */
export type EstadoMatricula = 'ACTIVO' | 'PROMOCION' | 'RETIRADO' | 'FINALIZADO';

export const NOMBRE_ESTADO: Record<EstadoMatricula, string> = {
  ACTIVO: 'Activo', PROMOCION: 'Promoción', RETIRADO: 'Retirado', FINALIZADO: 'Finalizado',
};

/** Un año en que se puede matricular y el estado que toma la matrícula. */
export interface PeriodoMatricula {
  year:   number;
  estado: 'ACTIVO' | 'PROMOCION';
}

/** GET /matriculas/periodo: el año en curso (ACTIVO) y el siguiente (PROMOCION). Ningún otro. */
export interface PeriodoInfo {
  yearEnCurso: number;
  opciones:    PeriodoMatricula[];
}

export interface MatriculaListItem {
  id_matricula:    number;
  year:            number;
  jornada:         JornadaEstudiante;
  fecha_matricula: string;
  estado:          EstadoMatricula;
  grado?: {
    id_grado: number;
    nombre:   string;
    jornada:  JornadaEstudiante;
  };
}
/** De quién es un número de documento fuera de los estudiantes (GET /matriculas/documento/:doc). */
export interface DuenoDocumento {
  tipo: 'docente' | 'acudiente' | 'usuario';
  nombre: string | null;
  telefono?: string | null;
  correo?: string | null;
}

/** Para qué año se rematricularía hoy a un estudiante (GET /matriculas/rematricula/:id). */
export type DestinoRematricula =
  | { posible: true; year: number; estado: 'ACTIVO' | 'PROMOCION' }
  | { posible: false; motivo: string };
