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

/** Registro civil, tarjeta de identidad, cédula, cédula de extranjería, PPT y pasaporte. */
/** Los estudiantes son menores de edad: registro civil o tarjeta de identidad. */
export type TipoDocumento = 'RC' | 'TI';
export type Sexo = 'F' | 'M';

export interface EstudianteListItem {
  numero_identidad: string;
  nombre:           string;
  fecha_nacimiento: string;
  tipo_documento?:  TipoDocumento | null;
  sexo?:            Sexo | null;
  rh?:              string;
  eps?:             string | null;
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
  tipo_documento?:   TipoDocumento | '';
  sexo?:             Sexo | '';
  rh?:               string;
  eps?:              string;
  direccion?:        string;
  observaciones?:    string;
}