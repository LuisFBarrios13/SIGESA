// src/hooks/useBoletinData.ts
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { boletinApi }                        from '../services/boletinApi';
import type { BoletinData }                  from '../types/boletin';
import { queryKeys }                         from '../lib/queryKeys';

interface UseBoletinDataReturn {
  data:      BoletinData | null;
  isLoading: boolean;
  error:     string;
  periodo:   number;
  year:      number;
  setPeriodo:(p: number) => void;
  setYear:   (y: number) => void;
  refresh:   () => void;
}

export const useBoletinData = (id_matricula: number): UseBoletinDataReturn => {
  const [periodo, setPeriodo] = useState(1);
  const [year,    setYear]    = useState(new Date().getFullYear());

  const { data, isPending, error, refetch } = useQuery({
    queryKey: queryKeys.boletin.detalle(id_matricula, periodo, year),
    queryFn:  () => boletinApi.get(id_matricula, periodo, year),
    // Sin matrícula válida no se consulta (la página muestra su propio mensaje).
    enabled:  !!id_matricula,
  });

  return {
    data:      data ?? null,
    isLoading: isPending,
    error:     error ? (error instanceof Error ? error.message : 'No se pudo cargar el boletín.') : '',
    periodo, year, setPeriodo, setYear,
    refresh:   () => { void refetch(); },
  };
};
