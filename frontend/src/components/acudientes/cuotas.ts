// src/components/acudientes/cuotas.ts
// Cálculos del portal del acudiente a partir de las cuentas que ya devuelve la API.
import type { CuentaCobro } from '../../services/pagosApi';
import type { MatriculaResumenAcudiente } from '../../services/acudienteApi';
import { NOMBRE_MES } from '../pagos/pagos.constants';

export interface Cuota {
  cuenta:      CuentaCobro;
  esMatricula: boolean;
  /** "Matrícula 2026" o "Marzo". */
  nombre:      string;
  /** "Mat", "Feb"… para la gráfica. */
  corto:       string;
  valor:       number;
  pagado:      number;
  saldo:       number;
}

export const prepararCuotas = (cuentas: CuentaCobro[]): Cuota[] =>
  cuentas
    .map((cuenta) => {
      const esMatricula = cuenta.concepto.nombre === 'MATRÍCULA';
      const valor  = Number(cuenta.valor_deuda);
      const pagado = cuenta.pagos.reduce((s, p) => s + Number(p.monto_pago), 0);
      const mes    = NOMBRE_MES[cuenta.mes] ?? String(cuenta.mes);
      return {
        cuenta, esMatricula, valor, pagado,
        saldo:  Math.max(0, valor - pagado),
        nombre: esMatricula ? `Matrícula ${cuenta.year}` : mes,
        corto:  esMatricula ? 'Mat' : mes.slice(0, 3),
      };
    })
    // Matrícula primero, luego las pensiones por mes
    .sort((a, b) => Number(b.esMatricula) - Number(a.esMatricula) || a.cuenta.mes - b.cuenta.mes);

export const resumirCuotas = (cuotas: Cuota[]) => {
  const contar = (lista: Cuota[]) => ({
    total:   lista.length,
    pagadas: lista.filter((c) => c.cuenta.estado === 'PAGADO').length,
  });
  return {
    total:      cuotas.length,
    pagadas:    cuotas.filter((c) => c.cuenta.estado === 'PAGADO').length,
    pendientes: cuotas.filter((c) => c.cuenta.estado === 'PENDIENTE').length,
    vencidas:   cuotas.filter((c) => c.cuenta.estado === 'VENCIDO').length,
    matricula:  contar(cuotas.filter((c) => c.esMatricula)),
    pensiones:  contar(cuotas.filter((c) => !c.esMatricula)),
    /** La primera cuota que falta por pagar (vencidas incluidas). */
    proxima:    cuotas.find((c) => c.cuenta.estado !== 'PAGADO') ?? null,
  };
};

/**
 * Una opción por año, del más antiguo al más reciente. Si por error hubiera dos
 * matrículas del mismo año, se muestra una sola (la activa, o la más reciente).
 */
export const matriculasPorAnio = (matriculas: MatriculaResumenAcudiente[]): MatriculaResumenAcudiente[] => {
  const porAnio = new Map<number, MatriculaResumenAcudiente>();
  for (const m of matriculas) {
    const actual = porAnio.get(m.year);
    if (!actual || (m.estado === 'ACTIVO' && actual.estado !== 'ACTIVO') ||
        (m.estado === actual.estado && m.id_matricula > actual.id_matricula)) {
      porAnio.set(m.year, m);
    }
  }
  return [...porAnio.values()].sort((a, b) => a.year - b.year);
};

export const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

/** 280000 → "280k", 1440000 → "1,44 M". */
export const fmtCorto = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 2 })} M`
    : n >= 1000 ? `${Math.round(n / 1000)}k` : String(n);
