import { useState, useEffect, useCallback } from 'react';
import { api }                              from '../services/api';
import type { EstudianteListItem }          from '../services/api';
import type { CuentaCobroDetalle }          from '../services/pagosApi';

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

export const useDashboard = (): UseDashboardReturn => {
  const [metrics,   setMetrics]   = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState('');
  const [year,      setYear]      = useState(new Date().getFullYear());

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [estudiantes, cuentas, docentes] = await Promise.all([
        api.get<EstudianteListItem[]>('/estudiantes'),
        api.get<CuentaCobroDetalle[]>(`/pagos?year=${year}`),
        api.get<any[]>('/docentes'),
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

      setMetrics({
        totalEstudiantes,
        estudiantesActivos,
        tasaMatricula,
        totalRecaudado,
        totalDeuda,
        totalDeudores: deudoresMap.size,
        totalDocentes: docentes.length,
        monthlyChart,
        topDeudores,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando el dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { metrics, isLoading, error, year, setYear, refresh: fetchData };
};