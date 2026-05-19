// src/hooks/useAcudiente.ts
// Single Responsibility: todo el estado y side-effects del portal de acudiente.

import { useState, useEffect, useCallback } from 'react';
import { acudienteApi }                     from '../services/acudienteApi';
import type {
  AcudientePerfil,
  EstudianteVinculado,
  MatriculaResumenAcudiente,
  ResumenPagosAcudiente,
} from '../services/acudienteApi';

interface UseAcudienteReturn {
  perfil:          AcudientePerfil | null;
  isLoading:       boolean;
  error:           string;
  selected:        EstudianteVinculado | null;
  selectStudent:   (e: EstudianteVinculado) => void;
  matricula:       MatriculaResumenAcudiente | null;
  selectMatricula: (m: MatriculaResumenAcudiente) => void;
  resumen:         ResumenPagosAcudiente | null;
  isLoadingResumen: boolean;
  resumenError:    string;
  refresh:         () => void;
}

/** Devuelve la matrícula activa o la más reciente */
const getDefaultMatricula = (e: EstudianteVinculado): MatriculaResumenAcudiente | null => {
  if (!e.matriculas.length) return null;
  return (
    e.matriculas.find((m) => m.estado === 'ACTIVO') ??
    [...e.matriculas].sort((a, b) => b.year - a.year)[0]
  );
};

export const useAcudiente = (): UseAcudienteReturn => {
  const [perfil,           setPerfil]           = useState<AcudientePerfil | null>(null);
  const [isLoading,        setIsLoading]        = useState(true);
  const [error,            setError]            = useState('');
  const [selected,         setSelected]         = useState<EstudianteVinculado | null>(null);
  const [matricula,        setMatricula]        = useState<MatriculaResumenAcudiente | null>(null);
  const [resumen,          setResumen]          = useState<ResumenPagosAcudiente | null>(null);
  const [isLoadingResumen, setIsLoadingResumen] = useState(false);
  const [resumenError,     setResumenError]     = useState('');

  // ── Carga inicial ──────────────────────────────────────────────────────────

  const fetchPerfil = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await acudienteApi.getMisEstudiantes();
      setPerfil(data);
      if (data.estudiantes.length > 0) {
        const first = data.estudiantes[0];
        setSelected(first);
        setMatricula(getDefaultMatricula(first));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la información.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchPerfil(); }, [fetchPerfil]);

  // ── Carga del resumen de pagos cuando cambia la matrícula ──────────────────

  useEffect(() => {
    if (!matricula) { setResumen(null); return; }
    setIsLoadingResumen(true);
    setResumenError('');
    acudienteApi.getResumenPagos(matricula.id_matricula)
      .then(setResumen)
      .catch((err) => {
        setResumenError(err instanceof Error ? err.message : 'No se pudieron cargar los pagos.');
        setResumen(null);
      })
      .finally(() => setIsLoadingResumen(false));
  }, [matricula]);

  // ── Handlers de selección ──────────────────────────────────────────────────

  const selectStudent = useCallback((e: EstudianteVinculado) => {
    setSelected(e);
    setMatricula(getDefaultMatricula(e));
    setResumen(null);
  }, []);

  const selectMatricula = useCallback((m: MatriculaResumenAcudiente) => {
    setMatricula(m);
    setResumen(null);
  }, []);

  return {
    perfil, isLoading, error,
    selected, selectStudent,
    matricula, selectMatricula,
    resumen, isLoadingResumen, resumenError,
    refresh: fetchPerfil,
  };
};