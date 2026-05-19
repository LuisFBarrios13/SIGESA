// src/hooks/useEditarDocente.ts
// Single Responsibility: ciclo de vida de la edición de un docente.

import { useState, useCallback } from 'react';
import { api }                   from '../services/api';
import type { DocenteListItem, ActualizarDocentePayload } from '../types/docentes';

// Servicio puntual — no requiere un archivo propio por su simplicidad
const docentesAdminApi = {
  actualizar: (cedula: string, payload: ActualizarDocentePayload) =>
    api.patch<DocenteListItem>(`/docentes/${cedula}`, payload),
};

interface UseEditarDocenteReturn {
  editando:         DocenteListItem | null;
  isLoading:        boolean;
  error:            string;
  abrirEdicion:     (d: DocenteListItem) => void;
  cerrarEdicion:    () => void;
  confirmarEdicion: (
    payload:   ActualizarDocentePayload,
    onSuccess: (actualizado: DocenteListItem) => void,
  ) => Promise<void>;
}

export const useEditarDocente = (): UseEditarDocenteReturn => {
  const [editando,  setEditando]  = useState<DocenteListItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState('');

  const abrirEdicion = useCallback((d: DocenteListItem) => {
    setEditando(d);
    setError('');
  }, []);

  const cerrarEdicion = useCallback(() => {
    setEditando(null);
    setError('');
  }, []);

  const confirmarEdicion = useCallback(
    async (
      payload:   ActualizarDocentePayload,
      onSuccess: (actualizado: DocenteListItem) => void,
    ) => {
      if (!editando) return;

      setIsLoading(true);
      setError('');

      try {
        const actualizado = await docentesAdminApi.actualizar(editando.cedula, payload);
        onSuccess(actualizado);
        setEditando(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'No se pudo actualizar el docente. Intenta de nuevo.',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [editando],
  );

  return { editando, isLoading, error, abrirEdicion, cerrarEdicion, confirmarEdicion };
};