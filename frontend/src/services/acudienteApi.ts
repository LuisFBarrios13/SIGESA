// src/services/acudienteApi.ts
import { api }            from './api';
import type { CuentaCobro } from './pagosApi'; // reutiliza el tipo existente

// ── Tipos del dominio ──────────────────────────────────────────────────────────

export interface GradoResumenAcudiente {
  id_grado: number;
  nombre:   string;
  jornada:  'MAÑANA' | 'TARDE';
}

export interface MatriculaResumenAcudiente {
  id_matricula:    number;
  year:            number;
  jornada:         'MAÑANA' | 'TARDE';
  fecha_matricula: string;
  estado:          'ACTIVO' | 'RETIRADO' | 'GRADUADO';
  grado:           GradoResumenAcudiente;
}

export interface EstudianteVinculado {
  numero_identidad: string;
  nombre:           string;
  fecha_nacimiento: string;
  rh?:              string;
  direccion?:       string;
  observaciones?:   string;
  matriculas:       MatriculaResumenAcudiente[];
  /** Inyectado de la tabla intermedia RelacionEA */
  RelacionEA?: {
    parentesco:          string | null;
    acudiente_principal: boolean;
  };
}

export interface AcudientePerfil {
  cedula:      string;
  nombre:      string;
  telefono:    string | null;
  correo:      string | null;
  estudiantes: EstudianteVinculado[];
}

export interface TarifaResumenAcudiente {
  year:            number;
  valor_pension:   string;
  valor_matricula: string;
}

export interface ResumenPagosAcudiente {
  matricula: {
    id_matricula: number;
    year:         number;
    jornada:      string;
    estado:       string;
    estudiante:   { numero_identidad: string; nombre: string };
    grado:        GradoResumenAcudiente;
  };
  cuentas:  CuentaCobro[];
  totales:  { deuda: number; pagado: number; pendiente: number };
  tarifa:   TarifaResumenAcudiente | null;
}

// ── Llamadas a la API ──────────────────────────────────────────────────────────

export const acudienteApi = {
  getMisEstudiantes: () =>
    api.get<AcudientePerfil>('/acudiente/mis-estudiantes'),

  getResumenPagos: (id_matricula: number) =>
    api.get<ResumenPagosAcudiente>(`/acudiente/pagos/${id_matricula}`),
};