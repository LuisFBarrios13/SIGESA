// src/types/dashboard.ts — respuesta de GET /api/dashboard?year=
import type { JornadaEstudiante } from './shared';

export interface MesRecaudo {
  month:     string; // 'ENE' … 'DIC'
  recaudado: number;
  deuda:     number; // lo facturado ese mes
}

export interface Deudor {
  nombre:    string;
  identidad: string;
  grado:     string;
  saldo:     number;
}

export interface GradoDashboard {
  idGrado:  number;
  nombre:   string;
  jornada:  JornadaEstudiante;
  docente:  string | null;
  activos:  number;
  promedio: number | null;
}

export interface PagoReciente {
  idPago:     number;
  fecha:      string;
  monto:      number;
  estudiante: string;
  grado:      string;
  concepto:   string;
  mes:        number;
  metodo:     string;
}

export interface ResumenAcademico {
  periodoActual:                  number | null;
  promedioGeneral:                number | null;
  notaAprobatoria:                number;
  estudiantesEvaluados:           number;
  estudiantesConMateriasPerdidas: number;
}

export interface DashboardData {
  totalEstudiantes:   number;
  estudiantesActivos: number;
  totalDocentes:      number;
  tasaMatricula:      number;
  totalRecaudado:     number;
  totalDeuda:         number;
  totalDeudores:      number;
  carteraVencida:     number;
  monthlyChart:       MesRecaudo[];
  topDeudores:        Deudor[];
  porGrado:           GradoDashboard[];
  gradosSinDocente:   number;
  porJornada:         Record<JornadaEstudiante, number>;
  ultimosPagos:       PagoReciente[];
  academico:          ResumenAcademico;
}
