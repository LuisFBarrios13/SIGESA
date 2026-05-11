// src/hooks/useMiGrado.ts
// Single Responsibility: state + side-effects for the Mi Grado page.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { docenteApi, type DocentePerfil, type MatriculaDocente } from '../services/docenteApi';

interface UseMiGradoReturn {
  perfil:        DocentePerfil | null;
  estudiantes:   MatriculaDocente[];
  isLoading:     boolean;
  error:         string;
  year:          number;
  setYear:       (y: number) => void;
  search:        string;
  setSearch:     (s: string) => void;
  gradoFilter:   number | 'TODOS';
  setGradoFilter:(g: number | 'TODOS') => void;
  filtered:      MatriculaDocente[];
  refresh:       () => void;
}

export const useMiGrado = (): UseMiGradoReturn => {
  const [perfil,       setPerfil]       = useState<DocentePerfil | null>(null);
  const [estudiantes,  setEstudiantes]  = useState<MatriculaDocente[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [error,        setError]        = useState('');
  const [year,         setYear]         = useState(new Date().getFullYear());
  const [search,       setSearch]       = useState('');
  const [gradoFilter,  setGradoFilter]  = useState<number | 'TODOS'>('TODOS');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [perfilData, estudiantesData] = await Promise.all([
        docenteApi.getPerfil(),
        docenteApi.getEstudiantes(year),
      ]);
      setPerfil(perfilData);
      setEstudiantes(estudiantesData);
    } catch {
      setError('No se pudo cargar la información del grado. Verifica tu conexión.');
    } finally {
      setIsLoading(false);
    }
  }, [year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return estudiantes.filter((m) => {
      const matchSearch = !q
        || m.estudiante.nombre.toLowerCase().includes(q)
        || m.estudiante.numero_identidad.includes(q);
      const matchGrado  = gradoFilter === 'TODOS' || m.grado.id_grado === gradoFilter;
      return matchSearch && matchGrado;
    });
  }, [estudiantes, search, gradoFilter]);

  return {
    perfil, estudiantes, isLoading, error,
    year, setYear,
    search, setSearch,
    gradoFilter, setGradoFilter,
    filtered,
    refresh: fetchData,
  };
};