import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { api }                              from '../services/api';
import type { EstudianteListItem }          from '../services/api';
import type { CuentaCobroDetalle }          from '../services/pagosApi';
import type { DocenteListItem }             from '../types/docentes';

const MESES = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];

export interface DashboardMetrics {
  totalEstudiantes:   number;
  estudiantesActivos: number;
  tasaMatricula:      number;
  totalRecaudado:     number;
  totalDeuda:         number;
  totalDeudores:      number;
  totalDocentes:      number;
  monthlyChart: {
    month:     string;
    recaudado: number;
    deuda:     number;
  }[];
  topDeudores: {
    nombre:    string;
    identidad: string;
    grado:     string;
    saldo:     number;
  }[];
}

interface UseDashboardReturn {
  metrics:  DashboardMetrics | null;
  isLoading: boolean;
  error:     string;
  year:      number;
  setYear:   (y: number) => void;
  refresh:   () => void;
}

/** Pide los datos al backend y calcula las métricas del año indicado. */
const cargarMetricas = async (year: number): Promise<DashboardMetrics> => {
  const [estudiantes, cuentas, docentes] = await Promise.all([
    api.get<EstudianteListItem[]>('/estudiantes'),
    api.get<CuentaCobroDetalle[]>(`/pagos?year=${year}`),
    api.get<DocenteListItem[]>('/docentes'),
  ]);

  // ── Estudiantes ──────────────────────────────────────
  const totalEstudiantes   = estudiantes.length;
  const estudiantesActivos = estudiantes.filter((e) =>
    e.matriculas.some((m) => m.estado === 'ACTIVO' && m.year === year),
  ).length;
  const tasaMatricula = totalEstudiantes > 0
    ? Math.round((estudiantesActivos / totalEstudiantes) * 100)
    : 0;

  // ── Financiero ───────────────────────────────────────
  const totalRecaudado = cuentas.reduce(
    (sum, c) => sum + c.pagos.reduce((s, p) => s + Number(p.monto_pago), 0), 0,
  );
  const totalDeuda = cuentas.reduce((sum, c) => sum + Number(c.valor_deuda), 0);

  // ── Deudores ─────────────────────────────────────────
  const deudoresMap = new Map<string, { nombre: string; identidad: string; grado: string; saldo: number }>();

  for (const c of cuentas.filter((c) => c.estado === 'VENCIDO')) {
    const id     = c.matricula.estudiante.numero_identidad;
    const pagado = c.pagos.reduce((s, p) => s + Number(p.monto_pago), 0);
    const saldo  = Math.max(0, Number(c.valor_deuda) - pagado);

    if (deudoresMap.has(id)) {
      deudoresMap.get(id)!.saldo += saldo;
    } else {
      deudoresMap.set(id, {
        nombre:    c.matricula.estudiante.nombre,
        identidad: id,
        grado:     c.matricula.grado.nombre,
        saldo,
      });
    }
  }

  const topDeudores = Array.from(deudoresMap.values())
    .sort((a, b) => b.saldo - a.saldo)
    .slice(0, 5);

  // ── Gráfica mensual ───────────────────────────────────
  const monthlyChart = MESES.map((month, i) => {
    const mes         = i + 1;
    const monthCuentas = cuentas.filter((c) => c.mes === mes);
    const recaudado   = monthCuentas.reduce(
      (s, c) => s + c.pagos.reduce((ps, p) => ps + Number(p.monto_pago), 0), 0,
    );
    const deuda = monthCuentas.reduce((s, c) => s + Number(c.valor_deuda), 0);
    return { month, recaudado, deuda };
  });

  return {
    totalEstudiantes,
    estudiantesActivos,
    tasaMatricula,
    totalRecaudado,
    totalDeuda,
    totalDeudores: deudoresMap.size,
    totalDocentes: docentes.length,
    monthlyChart,
    topDeudores,
  };
};

export const useDashboard = (): UseDashboardReturn => {
  const [year, setYear] = useState(new Date().getFullYear());

  const { data, isPending, error, refetch } = useQuery({
    queryKey: queryKeys.dashboard.byYear(year),
    queryFn:  () => cargarMetricas(year),
  });

  return {
    metrics:   data ?? null,
    isLoading: isPending,
    error:     error ? (error instanceof Error ? error.message : 'Error cargando el dashboard') : '',
    year, setYear,
    refresh:   () => { void refetch(); },
  };
};
