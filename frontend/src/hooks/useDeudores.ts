// src/hooks/useDeudores.ts
// Usa TanStack Query: la caché, el estado de carga/error y el descarte de
// respuestas viejas los maneja la librería (antes eran ~25 líneas a mano).
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pagosApi } from '../services/pagosApi';
import type { CuentaCobroDetalle } from '../services/pagosApi';
import type { DeudorAgrupado } from '../types/deudores';

import { queryKeys } from '../lib/queryKeys';

const agruparPorEstudiante = (cuentas: CuentaCobroDetalle[]): DeudorAgrupado[] => {
  const map = new Map<string, DeudorAgrupado>();

  for (const cuenta of cuentas) {
    const id = cuenta.matricula.estudiante.numero_identidad;

    if (!map.has(id)) {
      map.set(id, {
        estudiante:       cuenta.matricula.estudiante,
        grado:            cuenta.matricula.grado,
        id_matricula:     cuenta.matricula.id_matricula,
        year:             cuenta.matricula.year,
        cuentas_vencidas: [],
        saldo_total:      0,
      });
    }

    const deudor = map.get(id)!;
    const pagado = cuenta.pagos.reduce((s, p) => s + Number(p.monto_pago), 0);
    const saldo  = Math.max(0, Number(cuenta.valor_deuda) - pagado);

    deudor.cuentas_vencidas.push(cuenta);
    deudor.saldo_total += saldo;
  }

  return Array.from(map.values()).sort((a, b) => b.saldo_total - a.saldo_total);
};

interface UseDeudoresReturn {
  deudores:      DeudorAgrupado[];
  isLoading:     boolean;
  error:         string;
  search:        string;
  setSearch:     (v: string) => void;
  yearFilter:    number;
  setYearFilter: (v: number) => void;
  filtered:      DeudorAgrupado[];
  totalDeuda:    number;
  refresh:       () => void;
}

// Constante fuera del hook: un [] nuevo en cada render invalidaría los useMemo.
const SIN_DEUDORES: DeudorAgrupado[] = [];

export const useDeudores = (): UseDeudoresReturn => {
  const [search,     setSearch]     = useState('');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());

  // Cada año tiene su propia entrada en la caché: volver a un año ya visto
  // muestra los datos al instante.
  const { data: deudores = SIN_DEUDORES, isPending, isError, refetch } = useQuery({
    queryKey: queryKeys.deudores.byYear(yearFilter),
    queryFn:  async () => {
      const cuentas = await pagosApi.listarCuentas({ estado: 'VENCIDO', year: yearFilter });
      return agruparPorEstudiante(cuentas);
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return deudores;
    return deudores.filter(
      (d) =>
        d.estudiante.nombre.toLowerCase().includes(q) ||
        d.estudiante.numero_identidad.toLowerCase().includes(q),
    );
  }, [deudores, search]);

  const totalDeuda = useMemo(
    () => deudores.reduce((s, d) => s + d.saldo_total, 0),
    [deudores],
  );

  return {
    deudores,
    isLoading: isPending,
    error:     isError ? 'No se pudieron cargar los deudores. Verifica tu conexión.' : '',
    search, setSearch,
    yearFilter, setYearFilter,
    filtered, totalDeuda,
    refresh:   () => { void refetch(); },
  };
};
