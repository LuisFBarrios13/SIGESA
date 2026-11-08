// src/hooks/useAcudiente.ts
// Single Responsibility: todo el estado y side-effects del portal de acudiente.
// Los datos del servidor los maneja TanStack Query; aquí solo se guarda
// qué estudiante y qué matrícula eligió el usuario.

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { acudienteApi }                     from '../services/acudienteApi';
import type {
  AcudientePerfil,
  EstudianteVinculado,
  MatriculaResumenAcudiente,
  ResumenPagosAcudiente,
} from '../services/acudienteApi';
import { queryKeys } from '../lib/queryKeys';

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

const mensaje = (err: unknown, porDefecto: string) =>
  err instanceof Error ? err.message : porDefecto;

export const useAcudiente = (): UseAcudienteReturn => {
  // Solo se guarda lo que eligió el usuario (null = "usar el valor por defecto").
  const [idEstudiante, setIdEstudiante] = useState<string | null>(null);
  const [idMatricula,  setIdMatricula]  = useState<number | null>(null);

  // ── Perfil + estudiantes vinculados ─────────────────────────────────────────
  const perfilQuery = useQuery({
    queryKey: queryKeys.acudiente.perfil,
    queryFn:  acudienteApi.getMisEstudiantes,
  });
  const perfil = perfilQuery.data ?? null;

  // ── Selección derivada (sin useEffect) ──────────────────────────────────────
  // Por defecto: el primer estudiante y su matrícula activa / más reciente.
  const selected =
    perfil?.estudiantes.find((e) => e.numero_identidad === idEstudiante) ??
    perfil?.estudiantes[0] ??
    null;

  const matricula = selected
    ? (selected.matriculas.find((m) => m.id_matricula === idMatricula) ?? getDefaultMatricula(selected))
    : null;

  // ── Resumen de pagos de la matrícula seleccionada ───────────────────────────
  const resumenQuery = useQuery({
    queryKey: queryKeys.acudiente.resumen(matricula?.id_matricula ?? 0),
    queryFn:  () => acudienteApi.getResumenPagos(matricula!.id_matricula),
    enabled:  !!matricula,
  });

  // ── Handlers de selección ───────────────────────────────────────────────────
  const selectStudent = (e: EstudianteVinculado) => {
    setIdEstudiante(e.numero_identidad);
    setIdMatricula(null); // vuelve a la matrícula por defecto de ese estudiante
  };

  const selectMatricula = (m: MatriculaResumenAcudiente) => {
    setIdMatricula(m.id_matricula);
  };

  return {
    perfil,
    isLoading: perfilQuery.isPending,
    error:     perfilQuery.error ? mensaje(perfilQuery.error, 'No se pudo cargar la información.') : '',
    selected, selectStudent,
    matricula, selectMatricula,
    resumen:          matricula ? (resumenQuery.data ?? null) : null,
    // isLoading (no isPending): es false cuando la consulta está deshabilitada.
    isLoadingResumen: resumenQuery.isLoading,
    resumenError:     resumenQuery.error ? mensaje(resumenQuery.error, 'No se pudieron cargar los pagos.') : '',
    // "Actualizar" recarga perfil y pagos del portal.
    refresh: () => { void perfilQuery.refetch(); if (matricula) void resumenQuery.refetch(); },
  };
};
