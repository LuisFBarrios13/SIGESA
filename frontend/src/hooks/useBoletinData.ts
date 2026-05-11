// src/hooks/useBoletinData.ts
import { useState, useEffect, useCallback } from 'react';
import { boletinApi }                        from '../services/boletinApi';
import type { BoletinData }                  from '../types/boletin';

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

  const fetchData = useCallback(async () => {
    if (!id_matricula) return;
    setIsLoading(true);
    setError('');
    try {
      const result = await boletinApi.get(id_matricula, periodo, year);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el boletín.');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [id_matricula, periodo, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, isLoading, error, periodo, year, setPeriodo, setYear, refresh: fetchData };
};