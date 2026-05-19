// src/hooks/useEditarEstudiante.ts
// Single Responsibility: gestiona el ciclo de vida de la edición de un estudiante.
// Separado de EstudiantesPage para que el componente no mezcle lógica de negocio
// con lógica de presentación.

import { useState, useCallback } from 'react';
import { estudiantesApi }        from '../services/api';
import type { EstudianteListItem, ActualizarEstudiantePayload } from '../types/estudiantes';

interface UseEditarEstudianteReturn {
  /** Estudiante que está siendo editado (null = modal cerrado) */
  editando:       EstudianteListItem | null;
  isLoading:      boolean;
  error:          string;

  /** Abre el modal con el estudiante seleccionado */
  abrirEdicion:   (e: EstudianteListItem) => void;
  /** Cierra el modal y limpia el estado */
  cerrarEdicion:  () => void;
  /** Ejecuta el PATCH y llama onSuccess si el backend responde OK */
  confirmarEdicion: (
    payload:    ActualizarEstudiantePayload,
    onSuccess:  (actualizado: EstudianteListItem) => void,
  ) => Promise<void>;
}

export const useEditarEstudiante = (): UseEditarEstudianteReturn => {
  const [editando,  setEditando]  = useState<EstudianteListItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState('');

  const abrirEdicion = useCallback((e: EstudianteListItem) => {
    setEditando(e);
    setError('');
  }, []);

  const cerrarEdicion = useCallback(() => {
    setEditando(null);
    setError('');
  }, []);

  const confirmarEdicion = useCallback(
    async (
      payload:   ActualizarEstudiantePayload,
      onSuccess: (actualizado: EstudianteListItem) => void,
    ) => {
      if (!editando) return;

      setIsLoading(true);
      setError('');

      try {
        const actualizado = await estudiantesApi.actualizar(
          editando.numero_identidad,
          payload,
        );

        onSuccess(actualizado);
        setEditando(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'No se pudo actualizar el estudiante. Inténtalo de nuevo.',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [editando],
  );

  return {
    editando,
    isLoading,
    error,
    abrirEdicion,
    cerrarEdicion,
    confirmarEdicion,
  };
};