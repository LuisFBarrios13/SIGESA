// src/hooks/useDashboard.ts — métricas del dashboard de un año.
import { useCallback, useEffect, useState } from 'react';
import { dashboardApi } from '../services/dashboardApi';
import type { DashboardData } from '../types/dashboard';

/**
 * El servidor responde en milisegundos; sin un mínimo, el ícono de recargar
 * ni alcanza a girar y parece que el botón no hizo nada.
 */
export const GIRO_MINIMO_MS = 600;

export function useDashboard(year: number) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  /** Cuántas veces han llegado datos: sirve para repetir las animaciones al recargar. */
  const [cargas, setCargas] = useState(0);

  useEffect(() => {
    let vigente = true;
    let espera: ReturnType<typeof setTimeout> | undefined;
    const inicio = Date.now();
    setCargando(true);
    setError('');
    dashboardApi
      .obtener(year)
      .then(d => { if (vigente) { setData(d); setCargas(c => c + 1); } })
      .catch(e => { if (vigente) setError(e instanceof Error ? e.message : 'No se pudieron cargar los datos.'); })
      .finally(() => {
        const falta = Math.max(0, GIRO_MINIMO_MS - (Date.now() - inicio));
        espera = setTimeout(() => { if (vigente) setCargando(false); }, falta);
      });
    // Si cambia el año antes de responder, la respuesta vieja se descarta.
    return () => { vigente = false; clearTimeout(espera); };
  }, [year, version]);

  const recargar = useCallback(() => setVersion(v => v + 1), []);

  return { data, cargando, error, recargar, cargas };
}
