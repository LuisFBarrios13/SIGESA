// src/hooks/useDeudores.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { pagosApi } from '../services/pagosApi';
import type { CuentaCobroDetalle } from '../services/pagosApi';
import type { DeudorAgrupado } from '../types/deudores';

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

export const useDeudores = (): UseDeudoresReturn => {
  const [deudores,   setDeudores]   = useState<DeudorAgrupado[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());

  const fetchDeudores = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const cuentas = await pagosApi.listarCuentas({
        estado: 'VENCIDO',
        year:   yearFilter,
      });
      setDeudores(agruparPorEstudiante(cuentas));
    } catch {
      setError('No se pudieron cargar los deudores. Verifica tu conexión.');
    } finally {
      setIsLoading(false);
    }
  }, [yearFilter]);

  useEffect(() => { fetchDeudores(); }, [fetchDeudores]);

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
    deudores, isLoading, error,
    search, setSearch,
    yearFilter, setYearFilter,
    filtered, totalDeuda,
    refresh: fetchDeudores,
  };
};