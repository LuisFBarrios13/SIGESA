// src/types/acudientes-admin.ts
// Tipos del dominio de acudientes para la vista de administración.
// Separado de src/types/acudientes.ts que contiene tipos del portal del acudiente.

export interface AcudienteDetalle {
  cedula:            string;
  nombre:            string;
  telefono:          string | null;
  correo:            string | null;
  direccion:         string | null;
  telefono_trabajo:  string | null;
  direccion_trabajo: string | null;
  /** Sus estudiantes (solo al buscarlo por cédula en la matrícula). */
  estudiantes?:      { nombre: string }[];
  /** Información del vínculo con el estudiante */
  RelacionEA?: {
    parentesco:          string | null;
    acudiente_principal: boolean;
  };
}

export interface ActualizarAcudientePayload {
  nombre?:            string;
  telefono?:          string;
  correo?:            string;
  direccion?:         string;
  telefono_trabajo?:  string;
  direccion_trabajo?: string;
}

/** Resultado de buscar acudientes por nombre o cédula (paso 3 de la matrícula). */
export interface AcudienteCoincidencia {
  cedula:      string;
  nombre:      string;
  telefono:    string | null;
  estudiantes: { nombre: string }[];
}
