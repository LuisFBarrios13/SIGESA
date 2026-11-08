// src/hooks/useMiGrado.ts
// Single Responsibility: state + side-effects for the Mi Grado page.

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { docenteApi, type DocentePerfil, type MatriculaDocente } from '../services/docenteApi';
import { queryKeys } from '../lib/queryKeys';

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

// Constante fuera del hook: un [] nuevo en cada render invalidaría el useMemo.
const SIN_ESTUDIANTES: MatriculaDocente[] = [];

export const useMiGrado = (): UseMiGradoReturn => {
  const [year,        setYear]        = useState(new Date().getFullYear());
  const [search,      setSearch]      = useState('');
  const [gradoFilter, setGradoFilter] = useState<number | 'TODOS'>('TODOS');

  // El perfil no depende del año: se pide una vez y se reutiliza.
  const perfilQuery = useQuery({
    queryKey: queryKeys.miGrado.perfil,
    queryFn:  docenteApi.getPerfil,
  });

  // Los estudiantes sí cambian por año: una entrada de caché por año.
  const estudiantesQuery = useQuery({
    queryKey: queryKeys.miGrado.estudiantes(year),
    queryFn:  () => docenteApi.getEstudiantes(year),
  });

  const estudiantes = estudiantesQuery.data ?? SIN_ESTUDIANTES;

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

  const hasError = perfilQuery.isError || estudiantesQuery.isError;

  return {
    perfil:    perfilQuery.data ?? null,
    estudiantes,
    isLoading: perfilQuery.isPending || estudiantesQuery.isPending,
    error:     hasError ? 'No se pudo cargar la información del grado. Verifica tu conexión.' : '',
    year, setYear,
    search, setSearch,
    gradoFilter, setGradoFilter,
    filtered,
    refresh: () => {
      void perfilQuery.refetch();
      void estudiantesQuery.refetch();
    },
  };
};
