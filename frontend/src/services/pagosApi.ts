// src/services/pagosApi.ts
// Single Responsibility: only pagos-domain HTTP calls live here.

import { api } from './api';

// ── Shared types ──────────────────────────────────────────────

export type EstadoCuenta = 'PENDIENTE' | 'PAGADO' | 'VENCIDO';

export interface Tarifa {
  id_tarifa:       number;
  year:            number;
  valor_pension:   string;
  valor_matricula: string;
}

export interface ConceptoPago {
  id_concepto_pago: number;
  nombre:           string;
}

export interface MetodoPago {
  id_metodo: number;
  nombre:    string;
}

export interface PagoItem {
  id_pago:       number;
  monto_pago:    string;
  fecha_pago:    string;
  observaciones: string | null;
  metodo:        MetodoPago;
}

/** Cuenta de cobro sin datos de matrícula anidados (usado en ResumenPagos) */
export interface CuentaCobro {
  id_cuenta:    number;
  id_matricula: number;
  mes:          number;
  year:         number;
  valor_deuda:  string;
  estado:       EstadoCuenta;
  concepto:     ConceptoPago;
  pagos:        PagoItem[];
}

export interface EstudianteResumen {
  numero_identidad: string;
  nombre:           string;
  fecha_nacimiento: string;
}

export interface GradoResumen {
  id_grado: number;
  nombre:   string;
  jornada:  'MAÑANA' | 'TARDE';
}

export interface MatriculaResumen {
  id_matricula: number;
  year:         number;
  jornada:      'MAÑANA' | 'TARDE';
  estado:       string;
  estudiante:   EstudianteResumen;
  grado:        GradoResumen;
}

/**
 * Cuenta de cobro con matrícula, estudiante y grado anidados.
 * La devuelve GET /api/pagos (listarCuentas).
 */
export interface CuentaCobroDetalle extends CuentaCobro {
  matricula: MatriculaResumen;
}

export interface ResumenPagos {
  matricula: MatriculaResumen;
  cuentas:   CuentaCobro[];
  totales:   { deuda: number; pagado: number; pendiente: number };
  tarifa:    Tarifa | null;
}

export interface RegistrarPagoPayload {
  id_cuenta:      number;
  monto_pago:     number;
  id_metodo_pago: number;
  fecha_pago?:    string;
  observaciones?: string;
}

export interface PagoResult {
  pago:           PagoItem;
  estado:         EstadoCuenta;
  saldoRestante:  number;
}

// ── API calls ─────────────────────────────────────────────────

export const pagosApi = {
  /** Reference data */
  getConceptos: () => api.get<ConceptoPago[]>('/pagos/conceptos'),
  getMetodos:   () => api.get<MetodoPago[]>('/pagos/metodos'),

  /** Tarifas globales */
  getTarifa: (year: number) =>
    api.get<Tarifa | null>(`/pagos/tarifas/${year}`),

  upsertTarifa: (year: number, valor_pension: number, valor_matricula: number) =>
    api.post<Tarifa>('/pagos/tarifas', { year, valor_pension, valor_matricula }),

  /** Matrícula search + detail */
  buscarMatriculas: (q: string, year?: number) =>
    api.get<MatriculaResumen[]>(
      `/pagos/matriculas/buscar?q=${encodeURIComponent(q)}${year ? `&year=${year}` : ''}`,
    ),

  getResumen: (id_matricula: number) =>
    api.get<ResumenPagos>(`/pagos/matriculas/${id_matricula}`),

  /** Account generation */
  generarPension: (id_matricula: number, year: number) =>
    api.post<{ creadas: CuentaCobro[]; total: number; valor_pension: string }>(
      '/pagos/cuentas/pension',
      { id_matricula, year },
    ),

  crearCuentaMatricula: (id_matricula: number, year: number) =>
    api.post<CuentaCobro>('/pagos/cuentas/matricula', { id_matricula, year }),

  /** Payment registration */
  registrarPago: (p: RegistrarPagoPayload) =>
    api.post<PagoResult>('/pagos', p),

  /**
   * Lista todas las cuentas con matrícula, estudiante y grado anidados.
   * Devuelve CuentaCobroDetalle[] (incluye .matricula).
   */
  listarCuentas: (params: { year?: number; estado?: string; search?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.year)   qs.set('year',   String(params.year));
    if (params.estado) qs.set('estado', params.estado);
    if (params.search) qs.set('search', params.search);
    return api.get<CuentaCobroDetalle[]>(`/pagos?${qs.toString()}`);
  },
};