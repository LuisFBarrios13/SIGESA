// src/hooks/useEditarAcudiente.ts
// Single Responsibility: ciclo de vida de edición de acudiente.
// Incluye la carga del detalle del estudiante para obtener sus acudientes.

import { useState, useCallback } from 'react';
import { api }                   from '../services/api';
import { estudiantesApi }        from '../services/api';
import type { EstudianteDetalle }           from '../types/estudiantes';
import type {
  AcudienteDetalle,
  ActualizarAcudientePayload,
} from '../types/acudientes-admin';

// ── Servicio de acudientes (llamada al nuevo endpoint PATCH) ──

const acudientesApi = {
  actualizar: (cedula: string, payload: ActualizarAcudientePayload) =>
    api.patch<AcudienteDetalle>(`/acudientes/${cedula}`, payload),
};

// ── Estado del panel de acudientes ────────────────────────────

interface AcudientesPanelState {
  /** ID del estudiante cuyo panel está abierto */
  idEstudiante:  string | null;
  nombreEstudiante: string;
  acudientes:    AcudienteDetalle[];
  isLoading:     boolean;
  error:         string;
}

// ── Retorno del hook ──────────────────────────────────────────

interface UseEditarAcudienteReturn {
  /** Panel de acudientes — se abre al hacer clic en "Ver acudientes" */
  panel:         AcudientesPanelState;
  abrirPanel:    (idEstudiante: string, nombreEstudiante: string) => Promise<void>;
  cerrarPanel:   () => void;

  /** Modal de edición del acudiente seleccionado */
  editando:      AcudienteDetalle | null;
  isLoading:     boolean;
  error:         string;
  abrirEdicion:  (a: AcudienteDetalle) => void;
  cerrarEdicion: () => void;
  confirmarEdicion: (
    payload:   ActualizarAcudientePayload,
    onSuccess: (actualizado: AcudienteDetalle) => void,
  ) => Promise<void>;
}

const PANEL_INICIAL: AcudientesPanelState = {
  idEstudiante:     null,
  nombreEstudiante: '',
  acudientes:       [],
  isLoading:        false,
  error:            '',
};

export const useEditarAcudiente = (): UseEditarAcudienteReturn => {
  const [panel,     setPanel]     = useState<AcudientesPanelState>(PANEL_INICIAL);
  const [editando,  setEditando]  = useState<AcudienteDetalle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState('');

  // ── Panel: muestra la lista de acudientes de un estudiante ───

  const abrirPanel = useCallback(
    async (idEstudiante: string, nombreEstudiante: string) => {
      // Si ya está abierto el mismo estudiante, lo cierra (toggle)
      if (panel.idEstudiante === idEstudiante) {
        setPanel(PANEL_INICIAL);
        return;
      }

      setPanel({
        idEstudiante,
        nombreEstudiante,
        acudientes: [],
        isLoading:  true,
        error:      '',
      });

      try {
        const detalle: EstudianteDetalle = await estudiantesApi.obtener(idEstudiante);
        setPanel((prev) => ({
          ...prev,
          acudientes: detalle.acudientes ?? [],
          isLoading:  false,
        }));
      } catch {
        setPanel((prev) => ({
          ...prev,
          isLoading: false,
          error:     'No se pudieron cargar los acudientes. Intenta de nuevo.',
        }));
      }
    },
    [panel.idEstudiante],
  );

  const cerrarPanel = useCallback(() => {
    setPanel(PANEL_INICIAL);
    setEditando(null);
    setError('');
  }, []);

  // ── Modal de edición ─────────────────────────────────────────

  const abrirEdicion = useCallback((a: AcudienteDetalle) => {
    setEditando(a);
    setError('');
  }, []);

  const cerrarEdicion = useCallback(() => {
    setEditando(null);
    setError('');
  }, []);

  const confirmarEdicion = useCallback(
    async (
      payload:   ActualizarAcudientePayload,
      onSuccess: (actualizado: AcudienteDetalle) => void,
    ) => {
      if (!editando) return;

      setIsLoading(true);
      setError('');

      try {
        const actualizado = await acudientesApi.actualizar(editando.cedula, payload);
        onSuccess(actualizado);
        // Actualiza el acudiente en el panel sin recargar el detalle completo
        setPanel((prev) => ({
          ...prev,
          acudientes: prev.acudientes.map((a) =>
            a.cedula === actualizado.cedula ? { ...actualizado, RelacionEA: a.RelacionEA } : a,
          ),
        }));
        setEditando(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'No se pudo actualizar el acudiente. Intenta de nuevo.',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [editando],
  );

  return {
    panel,
    abrirPanel,
    cerrarPanel,
    editando,
    isLoading,
    error,
    abrirEdicion,
    cerrarEdicion,
    confirmarEdicion,
  };
};