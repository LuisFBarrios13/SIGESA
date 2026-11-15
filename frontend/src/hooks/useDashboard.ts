// src/hooks/useDashboard.ts — métricas del dashboard de un año.
import { useCallback, useEffect, useState } from 'react';
import { dashboardApi } from '../services/dashboardApi';
import type { DashboardData } from '../types/dashboard';

export function useDashboard(year: number) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError('');
    dashboardApi
      .obtener(year)
      .then(d => { if (vigente) setData(d); })
      .catch(e => { if (vigente) setError(e instanceof Error ? e.message : 'No se pudieron cargar los datos.'); })
      .finally(() => { if (vigente) setCargando(false); });
    // Si cambia el año antes de responder, la respuesta vieja se descarta.
    return () => { vigente = false; };
  }, [year, version]);

  const recargar = useCallback(() => setVersion(v => v + 1), []);

  return { data, cargando, error, recargar };
}
