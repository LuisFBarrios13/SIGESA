import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { api }                              from '../services/api';

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

/** Las métricas se calculan en el backend (GET /api/dashboard). */
const cargarMetricas = (year: number) =>
  api.get<DashboardMetrics>(`/dashboard?year=${year}`);

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
