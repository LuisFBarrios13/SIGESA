// src/hooks/useBoletinData.ts
import { useState, useEffect, useCallback } from 'react';
import { boletinApi }                        from '../services/boletinApi';
import type { BoletinData }                  from '../types/boletin';
import { useLatestRequest }                  from './useLatestRequest';

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
  const [data,      setData]      = useState<BoletinData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState('');
  const [periodo,   setPeriodo]   = useState(1);
  const [year,      setYear]      = useState(new Date().getFullYear());

  const startRequest = useLatestRequest();

  const fetchData = useCallback(async () => {
    if (!id_matricula) return;
    const isLatest = startRequest();
    setIsLoading(true);
    setError('');
    try {
      const result = await boletinApi.get(id_matricula, periodo, year);
      if (!isLatest()) return;
      setData(result);
    } catch (err) {
      if (!isLatest()) return;
      setError(err instanceof Error ? err.message : 'No se pudo cargar el boletín.');
      setData(null);
    } finally {
      if (isLatest()) setIsLoading(false);
    }
  }, [id_matricula, periodo, year, startRequest]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, isLoading, error, periodo, year, setPeriodo, setYear, refresh: fetchData };
};