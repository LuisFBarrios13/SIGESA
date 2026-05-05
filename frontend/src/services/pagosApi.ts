// src/services/pagosApi.ts
// Single Responsibility: only pagos-domain HTTP calls live here.

import { api } from './api';

// ── Shared types ──────────────────────────────────────────────

export type EstadoCuenta = 'PENDIENTE' | 'PAGADO' | 'VENCIDO';

export interface ConceptoPago {
  id_concepto_pago: number;
  nombre: string;
}

export interface MetodoPago {
  id_metodo: number;
  nombre: string;
}

export interface PagoItem {
  id_pago: number;
  monto_pago: string;
  fecha_pago: string;
  observaciones: string | null;
  metodo: MetodoPago;
}

export interface CuentaCobro {
  id_cuenta: number;
  id_matricula: number;
  mes: number;
  year: number;
  valor_deuda: string;
  estado: EstadoCuenta;
  concepto: ConceptoPago;
  pagos: PagoItem[];
}

export interface EstudianteResumen {
  numero_identidad: string;
  nombre: string;
  fecha_nacimiento: string;
}

export interface GradoResumen {
  id_grado: number;
  nombre: string;
  jornada: 'MAÑANA' | 'TARDE';
}

export interface MatriculaResumen {
  id_matricula: number;
  year: number;
  jornada: 'MAÑANA' | 'TARDE';
  estado: string;
  estudiante: EstudianteResumen;
  grado: GradoResumen;
}

export interface ResumenPagos {
  matricula: MatriculaResumen;
  cuentas: CuentaCobro[];
  totales: { deuda: number; pagado: number; pendiente: number };
}

export interface RegistrarPagoPayload {
  id_cuenta: number;
  monto_pago: number;
  id_metodo_pago: number;
  fecha_pago?: string;
  observaciones?: string;
}

export interface PagoResult {
  pago: PagoItem;
  estado: EstadoCuenta;
  saldoRestante: number;
}

export interface GenerarPensionPayload {
  id_matricula: number;
  valor_pension: number;
  year: number;
}

export interface CuentaMatriculaPayload {
  id_matricula: number;
  valor: number;
  year: number;
}

// ── API calls ─────────────────────────────────────────────────

export const pagosApi = {
  /** Reference data */
  getConceptos: ()                       => api.get<ConceptoPago[]>('/pagos/conceptos'),
  getMetodos:   ()                       => api.get<MetodoPago[]>('/pagos/metodos'),

  /** Matrícula search + detail */
  buscarMatriculas: (q: string, year?: number) =>
    api.get<MatriculaResumen[]>(`/pagos/matriculas/buscar?q=${encodeURIComponent(q)}${year ? `&year=${year}` : ''}`),

  getResumen: (id_matricula: number) =>
    api.get<ResumenPagos>(`/pagos/matriculas/${id_matricula}`),

  /** Account generation */
  generarPension: (p: GenerarPensionPayload) =>
    api.post<{ creadas: CuentaCobro[]; total: number }>('/pagos/cuentas/pension', p),

  crearCuentaMatricula: (p: CuentaMatriculaPayload) =>
    api.post<CuentaCobro>('/pagos/cuentas/matricula', p),

  /** Payment registration */
  registrarPago: (p: RegistrarPagoPayload) =>
    api.post<PagoResult>('/pagos', p),

  /** Admin list */
  listarCuentas: (params: { year?: number; estado?: string; search?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.year)   qs.set('year',   String(params.year));
    if (params.estado) qs.set('estado', params.estado);
    if (params.search) qs.set('search', params.search);
    return api.get<CuentaCobro[]>(`/pagos?${qs.toString()}`);
  },
};